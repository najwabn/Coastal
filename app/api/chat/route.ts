import { type NextRequest, NextResponse } from "next/server"

export const runtime = "nodejs"

export async function POST(req: NextRequest) {
  try {
    const { message, threadId } = await req.json()

    const apiKey = process.env.OPENAI_API_KEY
    const assistantId = process.env.OPENAI_ASSISTANT_ID

    if (!assistantId) {
      return NextResponse.json({ error: "Assistant ID not configured" }, { status: 500 })
    }

    if (!apiKey) {
      return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 })
    }

    console.log("Generating response with assistant:", assistantId)

    let currentThreadId = threadId

    // Create a new thread only if threadId is not provided (first message)
    if (!currentThreadId) {
      console.log("Creating new thread...")
      const threadResponse = await fetch("https://api.openai.com/v1/threads", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "OpenAI-Beta": "assistants=v2",
        },
      })

      if (!threadResponse.ok) {
        throw new Error(`Failed to create thread: ${threadResponse.statusText}`)
      }

      const thread = await threadResponse.json()
      currentThreadId = thread.id
      console.log("Created new thread:", currentThreadId)
    } else {
      console.log("Using existing thread:", currentThreadId)
    }

    // Construct the message content
    const userMessage = message || "Hello, I need help with babysitting services"

    const content = [
      {
        type: "text",
        text: userMessage,
      },
    ]

    // Add message to thread
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        role: "user",
        content: content,
      }),
    })

    if (!messageResponse.ok) {
      throw new Error(`Failed to add message: ${messageResponse.statusText}`)
    }

    console.log("Message added to thread")

    // Create and run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "OpenAI-Beta": "assistants=v2",
      },
      body: JSON.stringify({
        assistant_id: assistantId,
      }),
    })

    if (!runResponse.ok) {
      throw new Error(`Failed to create run: ${runResponse.statusText}`)
    }

    const run = await runResponse.json()
    const runId = run.id

    console.log("Created run:", runId)

    // Function to wait/delay
    const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

    // Check status and get response
    const checkStatusAndGetResponse = async (threadId: string, runId: string) => {
      let attempts = 0
      const maxAttempts = 60 // 60 seconds timeout

      while (attempts < maxAttempts) {
        const statusResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/runs/${runId}`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "OpenAI-Beta": "assistants=v2",
          },
        })

        if (!statusResponse.ok) {
          throw new Error(`Failed to check run status: ${statusResponse.statusText}`)
        }

        const runStatus = await statusResponse.json()
        console.log("Run status:", runStatus.status)

        if (runStatus.status === "completed") {
          break
        } else if (runStatus.status === "failed") {
          console.log("Run failed:", runStatus)
          throw new Error("Assistant run failed")
        }

        await delay(1000)
        attempts++
      }

      if (attempts >= maxAttempts) {
        throw new Error("Assistant response timeout")
      }

      // Get messages from thread
      const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${threadId}/messages`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "OpenAI-Beta": "assistants=v2",
        },
      })

      if (!messagesResponse.ok) {
        throw new Error(`Failed to get messages: ${messagesResponse.statusText}`)
      }

      const messages = await messagesResponse.json()
      const responseText = messages.data[0].content[0].text.value
      return responseText
    }

    // Call the function to get the response
    const response = await checkStatusAndGetResponse(currentThreadId, runId)

    console.log("Generated response:", response)

    // Return both the response and the threadId
    return NextResponse.json({ 
      response,
      threadId: currentThreadId 
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to generate response" },
      { status: 500 },
    )
  }
}
