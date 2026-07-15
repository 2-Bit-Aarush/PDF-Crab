import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { createAdminClient } from '@/lib/supabase/admin'
import { sendTelegramMessage, getCrabDialogue } from '@/lib/telegram'
import { triggerOCRJob, triggerCompileJob } from '@/lib/workers/background-worker'

const MAIN_KEYBOARD = {
  keyboard: [
    [{ text: '📂 My Vaults' }, { text: '📤 Upload Document' }],
    [{ text: '🧠 Compile Notes' }, { text: '📄 Recent Uploads' }],
    [{ text: '📊 Archive Status' }, { text: '⚙ Settings' }],
    [{ text: '❓ Help' }],
  ],
  resize_keyboard: true,
  one_time_keyboard: false,
}

export async function POST(request: Request) {
  try {
    const update = await request.json()
    const { origin } = new URL(request.url)

    // Handle Callback Query (inline button clicks)
    if (update.callback_query) {
      const cb = update.callback_query
      const chatId = cb.message.chat.id.toString()
      const data = cb.data as string
      const adminSupabase = createAdminClient()

      // Fetch linked profile
      const { data: profile } = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('telegram_chat_id', chatId)
        .maybeSingle()

      if (!profile) {
        await sendTelegramMessage(
          chatId,
          '❌ Account not connected. Please connect first.',
          getLinkMarkup(origin, chatId)
        )
        return NextResponse.json({ ok: true })
      }

      if (data.startsWith('select_vault:')) {
        const vaultId = data.split(':')[1]
        const { data: vault } = await adminSupabase
          .from('vaults')
          .select('*, documents(*), master_notes(id, title)')
          .eq('id', vaultId)
          .single()

        if (!vault) {
          await sendTelegramMessage(chatId, '❌ Shelf not found.')
          return NextResponse.json({ ok: true })
        }

        let resp = `<b>📂 Shelf: ${vault.name}</b>\n\n`
        const docs = vault.documents || []
        resp += `<b>Papers (${docs.length}):</b>\n`
        if (docs.length === 0) {
          resp += '  <i>No papers here yet.</i>\n'
        } else {
          docs.slice(0, 5).forEach((d: any) => {
            resp += `  • ${d.name} (${d.page_count} pg)\n`
          })
          if (docs.length > 5) resp += '  • ... and more\n'
        }

        const notes = vault.master_notes || []
        resp += `\n<b>Master Notes (${notes.length}):</b>\n`
        notes.forEach((n: any) => {
          resp += `  └─ 📝 ${n.title}\n`
        })

        const inlineKeyboard = {
          inline_keyboard: [
            [
              { text: '📤 Upload Here', callback_data: `upload_to:${vault.id}` },
              { text: '🗑 Delete Shelf', callback_data: `delete_vault_confirm:${vault.id}` },
            ],
          ],
        }

        await sendTelegramMessage(chatId, resp, inlineKeyboard)
      } else if (data.startsWith('upload_to:')) {
        const vaultId = data.split(':')[1]
        await adminSupabase
          .from('profiles')
          .update({ tg_default_vault_id: vaultId })
          .eq('id', profile.id)
        await sendTelegramMessage(
          chatId,
          `${getCrabDialogue('upload')}\nI set this shelf as your drop target. Send me any PDF now!`
        )
      } else if (data.startsWith('delete_vault_confirm:')) {
        const vaultId = data.split(':')[1]
        const inlineKeyboard = {
          inline_keyboard: [
            [
              { text: '🔥 Yes, Delete', callback_data: `delete_vault_execute:${vaultId}` },
              { text: '❌ Cancel', callback_data: 'settings' },
            ],
          ],
        }
        await sendTelegramMessage(
          chatId,
          `⚠️ Are you sure you want to delete this shelf and all its papers?`,
          inlineKeyboard
        )
      } else if (data.startsWith('delete_vault_execute:')) {
        const vaultId = data.split(':')[1]
        await adminSupabase.from('vaults').delete().eq('id', vaultId)
        await sendTelegramMessage(chatId, getCrabDialogue('delete'))
      } else if (data.startsWith('compile_select:')) {
        const noteId = data.split(':')[1]
        // Trigger compile job
        const { data: compileJob, error } = await adminSupabase
          .from('compile_jobs')
          .insert({
            master_note_id: noteId,
            status: 'queued',
            phase: 'Indexing Sources',
          })
          .select()
          .single()

        if (error) {
          await sendTelegramMessage(chatId, '❌ Could not start compile.')
        } else {
          triggerCompileJob(compileJob.id, origin)
          await sendTelegramMessage(chatId, getCrabDialogue('compile'))
        }
      } else if (data.startsWith('toggle_setting:')) {
        const key = data.split(':')[1]
        const updateObj: any = {}
        if (key === 'auto_compile') {
          updateObj.tg_auto_compile = !profile.tg_auto_compile
        } else if (key === 'notifications') {
          updateObj.tg_notifications = !profile.tg_notifications
        }
        await adminSupabase.from('profiles').update(updateObj).eq('id', profile.id)
        await sendSettingsPanel(chatId, adminSupabase, profile.id)
      }

      return NextResponse.json({ ok: true })
    }

    const message = update.message
    if (!message) {
      return NextResponse.json({ ok: true })
    }

    const chatId = message.chat.id.toString()
    const text = message.text || ''
    const adminSupabase = createAdminClient()

    // 1. Connection Start Command
    if (text.startsWith('/start')) {
      const code = text.split(' ')[1]

      // Check if user already linked
      const { data: profileByChat } = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('telegram_chat_id', chatId)
        .maybeSingle()

      if (profileByChat) {
        await sendTelegramMessage(
          chatId,
          `🦀\nI know who you are now.\nYou can leave papers here whenever you like.`,
          MAIN_KEYBOARD
        )
        return NextResponse.json({ ok: true })
      }

      if (!code) {
        await sendTelegramMessage(
          chatId,
          `🦀\nHello.\nI don't think we've met before.\n\nLet's connect your archive.`,
          getLinkMarkup(origin, chatId)
        )
        return NextResponse.json({ ok: true })
      }

      const { data: profile, error } = await adminSupabase
        .from('profiles')
        .select('*')
        .eq('telegram_link_code', code.trim())
        .maybeSingle()

      if (error || !profile) {
        await sendTelegramMessage(
          chatId,
          '❌ Invalid linking code. Click the link button below to link securely:',
          getLinkMarkup(origin, chatId)
        )
        return NextResponse.json({ ok: true })
      }

      await adminSupabase
        .from('profiles')
        .update({
          telegram_chat_id: chatId,
          telegram_username: message.from?.username || '',
        })
        .eq('id', profile.id)

      await sendTelegramMessage(
        chatId,
        `🦀\nI know who you are now.\nYou can leave papers here whenever you like.`,
        MAIN_KEYBOARD
      )
      return NextResponse.json({ ok: true })
    }

    // Gated Check for Linked Account
    const { data: profile } = await adminSupabase
      .from('profiles')
      .select('*')
      .eq('telegram_chat_id', chatId)
      .maybeSingle()

    if (!profile) {
      await sendTelegramMessage(
        chatId,
        `🦀\nHello.\nI don't think we've met before.\n\nLet's connect your archive.`,
        getLinkMarkup(origin, chatId)
      )
      return NextResponse.json({ ok: true })
    }

    // 2. Handle document attachment
    if (message.document) {
      const doc = message.document
      const isPdf = doc.mime_type === 'application/pdf'
      const isImage = doc.mime_type?.startsWith('image/')

      if (!isPdf && !isImage) {
        await sendTelegramMessage(chatId, '❌ I only collect PDFs and image scans.')
        return NextResponse.json({ ok: true })
      }

      await sendTelegramMessage(chatId, '📥 Taking file to the archives...')

      const fileId = doc.file_id
      const token = process.env.TELEGRAM_BOT_TOKEN
      const fileRes = await fetch(`https://api.telegram.org/bot${token}/getFile?file_id=${fileId}`)
      const fileData = await fileRes.json()

      if (!fileData.ok) {
        await sendTelegramMessage(chatId, '❌ I lost the paper path from the sky.')
        return NextResponse.json({ ok: true })
      }

      const filePath = fileData.result.file_path
      const downloadRes = await fetch(`https://api.telegram.org/file/bot${token}/${filePath}`)
      const buffer = Buffer.from(await downloadRes.arrayBuffer())

      // 3. Find or Create Vault Target
      let vaultId = profile.tg_default_vault_id
      let vault: any = null

      if (vaultId) {
        const { data } = await adminSupabase.from('vaults').select('*').eq('id', vaultId).maybeSingle()
        vault = data
      }

      if (!vault) {
        // Fallback: use first vault or create Telegram Inbox
        const { data: firstVault } = await adminSupabase
          .from('vaults')
          .select('*')
          .eq('owner_id', profile.id)
          .limit(1)
          .maybeSingle()

        if (firstVault) {
          vault = firstVault
        } else {
          const { data: newVault, error: vErr } = await adminSupabase
            .from('vaults')
            .insert({ name: 'Telegram Inbox', owner_id: profile.id })
            .select()
            .single()
          if (vErr) {
            await sendTelegramMessage(chatId, '❌ Failed to clear space for new shelf.')
            return NextResponse.json({ ok: true })
          }
          vault = newVault
        }
        // Save as default
        await adminSupabase
          .from('profiles')
          .update({ tg_default_vault_id: vault.id })
          .eq('id', profile.id)
      }

      const checksum = crypto.createHash('sha256').update(buffer).digest('hex')

      // Check duplicates
      const { data: existingDoc } = await adminSupabase
        .from('documents')
        .select('id, name')
        .eq('checksum', checksum)
        .eq('owner_id', profile.id)
        .maybeSingle()

      if (existingDoc) {
        await sendTelegramMessage(
          chatId,
          `⚠️ Duplicate checksum found! Reference created to existing document: "${existingDoc.name}".`
        )
        return NextResponse.json({ ok: true })
      }

      const fileUUID = crypto.randomUUID()
      const storagePath = `users/${profile.id}/vaults/${vault.id}/${fileUUID}-${doc.file_name || 'telegram-doc.pdf'}`

      const { error: uploadError } = await adminSupabase.storage
        .from('pdfs')
        .upload(storagePath, buffer, {
          contentType: doc.mime_type || (isPdf ? 'application/pdf' : 'image/png'),
          upsert: true,
        })

      if (uploadError) {
        await sendTelegramMessage(chatId, `❌ Storage upload failed: ${uploadError.message}`)
        return NextResponse.json({ ok: true })
      }

      const { data: documentRecord } = await adminSupabase
        .from('documents')
        .insert({
          id: fileUUID,
          vault_id: vault.id,
          name: doc.file_name || 'telegram-doc.pdf',
          storage_path: storagePath,
          size: buffer.length,
          mime_type: doc.mime_type || (isPdf ? 'application/pdf' : 'image/png'),
          page_count: 1,
          checksum,
          owner_id: profile.id,
        })
        .select()
        .single()

      if (!documentRecord) {
        await sendTelegramMessage(chatId, '❌ Failed to register document metadata.')
        return NextResponse.json({ ok: true })
      }

      const { data: ocrJob } = await adminSupabase
        .from('ocr_jobs')
        .insert({
          document_id: documentRecord.id,
          status: 'queued',
        })
        .select()
        .single()

      if (ocrJob) {
        triggerOCRJob(ocrJob.id, origin)
        await sendTelegramMessage(
          chatId,
          `${getCrabDialogue('upload')}\nI put it on shelf <b>${vault.name}</b> and queued OCR.`
        )

        // If auto-compile setting is on, trigger compile job
        if (profile.tg_auto_compile) {
          const { data: note } = await adminSupabase
            .from('master_notes')
            .select('id')
            .eq('vault_id', vault.id)
            .eq('active', true)
            .limit(1)
            .maybeSingle()

          if (note) {
            const { data: compileJob } = await adminSupabase
              .from('compile_jobs')
              .insert({
                master_note_id: note.id,
                status: 'queued',
                phase: 'Indexing Sources',
              })
              .select()
              .single()

            if (compileJob) {
              triggerCompileJob(compileJob.id, origin)
            }
          }
        }
      }

      return NextResponse.json({ ok: true })
    }

    // 3. Command routes matching persistent reply keyboards
    if (text === '📂 My Vaults') {
      const { data: vaults } = await adminSupabase
        .from('vaults')
        .select('id, name')
        .eq('owner_id', profile.id)

      if (!vaults || vaults.length === 0) {
        await sendTelegramMessage(chatId, getCrabDialogue('empty'))
        return NextResponse.json({ ok: true })
      }

      const inlineKeyboard = {
        inline_keyboard: vaults.map((v) => [
          { text: `📂 ${v.name}`, callback_data: `select_vault:${v.id}` },
        ]),
      }

      await sendTelegramMessage(chatId, 'Which shelf would you like to inspect?', inlineKeyboard)
      return NextResponse.json({ ok: true })
    }

    if (text === '📤 Upload Document') {
      await sendTelegramMessage(
        chatId,
        '🦀\nYou can send me a PDF or image here, and I\'ll put it in your default vault.'
      )
      return NextResponse.json({ ok: true })
    }

    if (text === '🧠 Compile Notes') {
      const { data: notes } = await adminSupabase
        .from('master_notes')
        .select('id, title, vaults(name)')
        .eq('active', true)
        .eq('vaults.owner_id', profile.id)

      if (!notes || notes.length === 0) {
        await sendTelegramMessage(chatId, '❌ No compilations ready to trigger.')
        return NextResponse.json({ ok: true })
      }

      const inlineKeyboard = {
        inline_keyboard: notes.map((n: any) => [
          { text: `🧠 Compile: ${n.title}`, callback_data: `compile_select:${n.id}` },
        ]),
      }

      await sendTelegramMessage(chatId, 'Which note should I compile?', inlineKeyboard)
      return NextResponse.json({ ok: true })
    }

    if (text === '📄 Recent Uploads') {
      const { data: docs } = await adminSupabase
        .from('documents')
        .select('id, name, created_at, page_count')
        .eq('owner_id', profile.id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (!docs || docs.length === 0) {
        await sendTelegramMessage(chatId, 'No papers uploaded yet.')
        return NextResponse.json({ ok: true })
      }

      let resp = '<b>📄 Recent papers added:</b>\n\n'
      docs.forEach((d) => {
        resp += `• ${d.name} (${d.page_count} pg) - <i>${new Date(d.created_at).toLocaleDateString()}</i>\n`
      })

      await sendTelegramMessage(chatId, resp)
      return NextResponse.json({ ok: true })
    }

    if (text === '📊 Archive Status') {
      const { count: vaultsCount } = await adminSupabase
        .from('vaults')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', profile.id)

      const { data: docs } = await adminSupabase
        .from('documents')
        .select('size')
        .eq('owner_id', profile.id)

      const docsCount = docs?.length || 0
      const totalSize = (docs || []).reduce((sum, d) => sum + Number(d.size), 0)
      const sizeMB = (totalSize / (1024 * 1024)).toFixed(2)

      const { count: notesCount } = await adminSupabase
        .from('master_notes')
        .select('*', { count: 'exact', head: true })
        .eq('active', true)

      // Count pending OCR jobs
      const { count: pendingOcr } = await adminSupabase
        .from('ocr_jobs')
        .select('*', { count: 'exact', head: true })
        .in('status', ['queued', 'processing'])

      const { count: pendingCompile } = await adminSupabase
        .from('compile_jobs')
        .select('*', { count: 'exact', head: true })
        .in('status', ['queued', 'processing'])

      let resp = `<b>📊 Archive Status Report</b>\n\n`
      resp += `📁 Shelves (Vaults): <b>${vaultsCount || 0}</b>\n`
      resp += `📄 Papers (Documents): <b>${docsCount}</b>\n`
      resp += `📝 Compilations: <b>${notesCount || 0}</b>\n`
      resp += `📦 Space occupied: <b>${sizeMB} MB</b>\n\n`
      resp += `⏳ Pending jobs: <b>${(pendingOcr || 0) + (pendingCompile || 0)}</b>`

      await sendTelegramMessage(chatId, resp)
      return NextResponse.json({ ok: true })
    }

    if (text === '⚙ Settings') {
      await sendSettingsPanel(chatId, adminSupabase, profile.id)
      return NextResponse.json({ ok: true })
    }

    if (text === '❓ Help') {
      await sendTelegramMessage(
        chatId,
        `🦀\nI'm the archivist! Send me papers, and I'll keep them safe on the shelves. Use the buttons below to look around.`
      )
      return NextResponse.json({ ok: true })
    }

    await sendTelegramMessage(chatId, '🦀\nI\'m only a little crab. I don\'t understand that.')
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error('Telegram bot Webhook execution failed:', err)
    return NextResponse.json({ ok: true })
  }
}

function getLinkMarkup(origin: string, chatId: string) {
  return {
    inline_keyboard: [
      [
        {
          text: '🔗 Link PDF-Crab Account',
          url: `${origin}/profile?tg_chat_id=${chatId}`,
        },
      ],
    ],
  }
}

async function sendSettingsPanel(chatId: string, supabase: any, profileId: string) {
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', profileId).single()
  const { data: defaultVault } = profile.tg_default_vault_id
    ? await supabase.from('vaults').select('name').eq('id', profile.tg_default_vault_id).maybeSingle()
    : { data: null }

  let resp = `<b>⚙ Settings Panel</b>\n\n`
  resp += `Auto Compile: <b>${profile.tg_auto_compile ? 'Enabled' : 'Disabled'}</b>\n`
  resp += `Notifications: <b>${profile.tg_notifications ? 'Enabled' : 'Disabled'}</b>\n`
  resp += `Default Target: <b>${defaultVault?.name || 'Telegram Inbox'}</b>\n`

  const inlineKeyboard = {
    inline_keyboard: [
      [
        {
          text: `${profile.tg_auto_compile ? '🔴 Disable' : '🟢 Enable'} Auto Compile`,
          callback_data: 'toggle_setting:auto_compile',
        },
      ],
      [
        {
          text: `${profile.tg_notifications ? '🔴 Mute' : '🟢 Unmute'} Notifications`,
          callback_data: 'toggle_setting:notifications',
        },
      ],
    ],
  }

  await sendTelegramMessage(chatId, resp, inlineKeyboard)
}
