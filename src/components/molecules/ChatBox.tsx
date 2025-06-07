import { useEffect, useState } from 'react'
import { IoMdClose } from 'react-icons/io'
import { DaTextarea } from '../atoms/DaTextarea'
import ReactMarkdown from 'react-markdown'

interface ReactRenderProps {
  markdownText: string
}

const MarkdownRender = ({ markdownText }: ReactRenderProps) => {
  return (
    <ReactMarkdown
      className="markdown-content text-muted-foreground text-base max-w-none"
      components={{
        h1: ({ node, ...props }) => (
          <h1
            className="text-4xl font-extrabold mt-8 mb-4 text-gray-900 dark:text-gray-100 border-b pb-2 border-gray-200 dark:border-gray-700"
            {...props}
          />
        ),
        h2: ({ node, ...props }) => (
          <h2
            className="text-3xl font-bold mt-6 mb-3 text-gray-800 dark:text-gray-200"
            {...props}
          />
        ),
        h3: ({ node, ...props }) => (
          <h3
            className="text-2xl font-semibold mt-5 mb-2 text-gray-700 dark:text-gray-300"
            {...props}
          />
        ),
        h4: ({ node, ...props }) => (
          <h4
            className="text-xl font-semibold mt-4 mb-1 text-gray-600 dark:text-gray-400"
            {...props}
          />
        ),
        h5: ({ node, ...props }) => (
          <h5
            className="text-lg font-medium mt-3 text-gray-600 dark:text-gray-400"
            {...props}
          />
        ),
        h6: ({ node, ...props }) => (
          <h6
            className="text-base font-medium mt-2 text-gray-500 dark:text-gray-500"
            {...props}
          />
        ),

        // Paragraph
        p: ({ node, ...props }) => (
          <p
            className="mb-4 leading-relaxed text-gray-700 dark:text-gray-300"
            {...props}
          />
        ),

        // Links
        a: ({ node, ...props }) => (
          <a
            className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-200 underline transition-colors duration-200"
            target="_blank" // Often good practice for external links
            rel="noopener noreferrer" // Security best practice
            {...props}
          />
        ),

        // Lists
        ul: ({ node, ...props }) => (
          <ul
            className="list-disc pl-6 mb-4 text-gray-700 dark:text-gray-300"
            {...props}
          />
        ),
        ol: ({ node, ...props }) => (
          <ol
            className="list-decimal pl-6 mb-4 text-gray-700 dark:text-gray-300"
            {...props}
          />
        ),
        li: ({ node, ...props }) => (
          <li className="mb-2 leading-relaxed" {...props} />
        ),

        // Blockquote
        blockquote: ({ node, ...props }) => (
          <blockquote
            className="border-l-4 border-gray-400 pl-4 py-2 my-4 italic text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded"
            {...props}
          />
        ),

        // Code
        code: ({ node, ...props }) => (
          <code
            className={`font-mono text-sm block bg-gray-800 text-gray-200 p-4 rounded-md overflow-x-auto my-4`}
            {...props}
          />
        ),
        // For preformatted blocks (like code blocks)
        pre: ({ node, ...props }) => (
          <pre
            className="bg-gray-800 text-gray-200 p-4 rounded-md overflow-x-auto my-4"
            {...props}
          />
        ),

        // Tables
        table: ({ node, ...props }) => (
          <table
            className="w-full border-collapse my-4 text-gray-700 dark:text-gray-300"
            {...props}
          />
        ),
        thead: ({ node, ...props }) => (
          <thead
            className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600"
            {...props}
          />
        ),
        th: ({ node, ...props }) => (
          <th
            className="px-4 py-2 text-left font-semibold text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-600"
            {...props}
          />
        ),
        tbody: ({ node, ...props }) => <tbody {...props} />,
        tr: ({ node, ...props }) => (
          <tr
            className="border-b border-gray-100 dark:border-gray-700 last:border-b-0 even:bg-gray-50 dark:even:bg-gray-800"
            {...props}
          />
        ),
        td: ({ node, ...props }) => (
          <td
            className="px-4 py-2 border border-gray-200 dark:border-gray-600"
            {...props}
          />
        ),

        // Images
        img: ({ node, ...props }) => (
          <img
            className="max-w-full h-auto mx-auto my-4 rounded-lg shadow-md"
            {...props}
          />
        ),

        // Horizontal Rule
        hr: ({ node, ...props }) => (
          <hr
            className="my-8 border-t-2 border-gray-200 dark:border-gray-700"
            {...props}
          />
        ),

        // Strong and Emphasis
        strong: ({ node, ...props }) => (
          <strong
            className="font-bold text-gray-900 dark:text-gray-100"
            {...props}
          />
        ),
        em: ({ node, ...props }) => <em className="italic" {...props} />,

        // Other less common but useful elements
        del: ({ node, ...props }) => (
          <del
            className="line-through text-gray-500 dark:text-gray-400"
            {...props}
          />
        ),
        // Keyboard input
        kbd: ({ node, ...props }) => (
          <kbd
            className="inline-block px-1.5 py-0.5 text-xs font-semibold text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm"
            {...props}
          />
        ),
      }}
    >
      {markdownText || ''}
    </ReactMarkdown>
  )
}

const genAIURL = process.env.N8N_AGENT || ''

const N8NChatIntegration = ({}) => {
  const [messages, setMessages] = useState<any[]>([])
  const [inputValue, setInputValue] = useState('')

  const sendMessage = async () => {
    if (!inputValue.trim()) return

    const newMessage = { sender: 'user', text: inputValue }
    setMessages((prevMessages) => [...prevMessages, newMessage])

    try {
      const response = await fetch(
        genAIURL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            action: 'sendMessage',
            chatInput: inputValue,
            sessionId: '1818c26f-7842-4901-9f46-615ef1e20724',
          }),
        },
      )

      const data = await response.json()
      const botMessage = { sender: 'bot', text: data.output }
      setMessages((prevMessages) => [...prevMessages, botMessage])
    } catch (error) {
      console.error('Error sending message:', error)
    }

    setInputValue('')
  }

  return (
    <div className="grow flex flex-col">
      <div className="grow">
        {messages.map((msg, index) => (
          <div
            key={index}
            className={`mt-2 text-gray-700 rounded px-2 py-2 
            ${msg.sender == 'user' && 'ml-8 text-white bg-da-primary-500'} ${msg.sender == 'bot' && 'mr-8 bg-slate-200'}`}
          >
            {msg.sender == 'user' && <>{msg.text}</> }
            {msg.sender == 'bot' && <MarkdownRender markdownText={msg.text} /> }
          </div>
        ))}
      </div>
      <div className="border-t border-gray-300 pt-2">
        <DaTextarea
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex w-full "
          onKeyPress={(e) => {
            if (e.key === 'Enter') sendMessage()
          }}
          placeholder="Type your request..."
          textareaClassName="!text-lg"
        />
      </div>
    </div>
  )
  return <div></div>
}

const ChatBox = ({}) => {
  const [showAI, setShowAI] = useState(false)

  return (
    <>
      <div className="px-2">
        { genAIURL && <img
          alt="ai agent"
          onClick={() => {
            setShowAI((v) => !v)
          }}
          className="w-6 h-6 hover:scale-125 cursor-pointer"
          src="/imgs/ai.png"
        />}
      </div>
      {showAI && (
        <div className="fixed p-2 left-1 top-[60px] h-[90vh] w-[360px] bg-white rounded-lg shadow-xl flex flex-col"
          style={{zIndex: 99}}>
          <div className="flex text-xl pb-1 pl-2 font-semibold text-slate-700 border-b border-slate-300">
            digital.auto AI agent
            <div className="grow"></div>
            <IoMdClose
              className="text-black hover:scale-110 cursor-pointer"
              size={26}
              onClick={() => {
                setShowAI(false)
              }}
            />
          </div>
          <N8NChatIntegration />
        </div>
      )}
    </>
  )
}

export default ChatBox
