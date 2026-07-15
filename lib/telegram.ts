export function getCrabDialogue(category: string): string {
  // 1/150 chance for rare dialogue
  if (Math.random() < 1 / 150) {
    const rares = [
      'Bro...\nI only have little claws.',
      'Bro...\nthere are definitely too many papers.',
      'Bro...\nwhat even is this.',
    ]
    return `🦀\n${rares[Math.floor(Math.random() * rares.length)]}`
  }

  // 1/15 chance for philosophical dialogue
  if (Math.random() < 1 / 15) {
    const philo = [
      'Sometimes I wonder where forgotten papers go.',
      'Humans remember with paper. I remember places.',
      'This archive keeps getting bigger.',
      'I hope nothing important gets lost.',
      'Every shelf tells a different story.',
    ]
    return `🦀\n${philo[Math.floor(Math.random() * philo.length)]}`
  }

  // Standard dialogues
  const standards: Record<string, string[]> = {
    upload: ["Found another paper. I'll keep it safe."],
    upload_many: ["That's a lot today. I'll make some room."],
    upload_huge: ["I think...\ntoday is a paper day."],
    ocr: ["I'm still reading. These symbols are difficult."],
    compile: ["I'll try putting everything together."],
    compile_halfway: ["Humans repeat themselves a lot."],
    compile_complete: ["Everything fits now."],
    failed: ["I dropped something. Can we try again?"],
    delete: ["You worked hard collecting this."],
    empty: ["It echoes in here."],
    new_vault: ["Another shelf! I like new shelves."],
    large_vault: ["This shelf is getting busy."],
    very_large_vault: ["I didn't know shelves could hold this much."],
  }

  const list = standards[category] || ["Hello! I'm taking care of the papers."]
  return `🦀\n${list[Math.floor(Math.random() * list.length)]}`
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
  replyMarkup?: any
): Promise<void> {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) {
    console.error('TELEGRAM_BOT_TOKEN not configured')
    return
  }

  let retries = 5
  let delay = 1000

  while (retries >= 0) {
    try {
      const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text,
          parse_mode: 'HTML',
          reply_markup: replyMarkup || undefined,
        }),
      })

      if (res.ok) return
      const errData = await res.json().catch(() => ({}))
      throw new Error(errData.description || `HTTP status ${res.status}`)
    } catch (err: any) {
      if (retries === 0) {
        console.error(`Telegram notification failed: ${err.message}`)
        throw err
      }
      retries--
      await new Promise((resolve) => setTimeout(resolve, delay))
      delay *= 2
    }
  }
}
