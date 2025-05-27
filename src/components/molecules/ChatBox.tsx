import { createChat } from '@n8n/chat'
import { useEffect, useState } from 'react'
import { IoMdClose } from 'react-icons/io'

const ChatBox = ({}) => {
  const [showAI, setShowAI] = useState(false)

  useEffect(() => {
    // createChat({
    //     target: '#chatbox',
    //     webhookUrl: 'https://digitalautodev.app.n8n.cloud/webhook/1a8ae71f-42d7-4bb0-946d-bdc095ed1a2f/chat',
    //     // webhookConfig: {
    //     //     method: 'POST',
    //     //     headers: {}
    //     // },
    //     mode: 'window',
    //     chatInputKey: 'chatInput',
    //     chatSessionKey: 'sessionId',
    //     metadata: {},
    //     showWelcomeScreen: false,
    //     defaultLanguage: 'en',
    //     initialMessages: [
    //         'Hi there! 👋',
    //         'My name is Nathan. How can I assist you today?'
    //     ],
    // });
  }, [])

  return (
    <>
      {showAI && (
        <div className="fixed p-2 z-50 left-1 top-[60px] w-[360px] bg-white rounded-lg shadow-xl">
          {/* <div className="flex">
            <div className="grow"></div>
            <IoMdClose
              className="text-black hover:scale-110 cursor-pointer"
              size={26}
              onClick={() => {
                setShowAI(false)
              }}
            />
          </div> */}
          <div id="chatbox" className="chatbox">
            {/* <iframe title="chatbox" src="https://digitalautodev.app.n8n.cloud/webhook/1a8ae71f-42d7-4bb0-946d-bdc095ed1a2f/chat"/> */}
          </div>
        </div>
      )}
    </>
  )
}

export default ChatBox
