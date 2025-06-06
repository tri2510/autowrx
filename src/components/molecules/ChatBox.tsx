// import { createChat } from '@n8n/chat'
import { useEffect, useState } from 'react'
import { IoMdClose } from 'react-icons/io'
import { DaTextarea } from '../atoms/DaTextarea';

const N8NChatIntegration = ({}) => {
const [messages, setMessages] = useState<any[]>([]);
const [inputValue, setInputValue] = useState('');

const sendMessage = async () => {
  if (!inputValue.trim()) return;

  const newMessage = { sender: 'user', text: inputValue };
  setMessages((prevMessages) => [...prevMessages, newMessage]);

  try {
    const response = await fetch('https://digitalautodev.app.n8n.cloud/webhook/1a8ae71f-42d7-4bb0-946d-bdc095ed1a2f/chat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ message: inputValue }),
    });

    const data = await response.json();
    const botMessage = { sender: 'bot', text: data.reply };
    setMessages((prevMessages) => [...prevMessages, botMessage]);
  } catch (error) {
    console.error('Error sending message:', error);
  }

  setInputValue('');
};

return (
  <div className="grow flex flex-col">
    <div className="grow">
      {messages.map((msg, index) => (
        <div key={index} className={`mt-2 bg-slate-100 rounded px-2 py-1 ${msg.sender}`}>
          {msg.text}
        </div>
      ))}
    </div>
    <div className="border-t border-gray-300 pt-2">
      <DaTextarea 
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        className="flex w-full"
        onKeyPress={(e) => {
          if (e.key === 'Enter') sendMessage();
        }}
        placeholder="Type your request..."
        textareaClassName="!text-sm"/>
      {/* <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyPress={(e) => {
          if (e.key === 'Enter') sendMessage();
        }}
        placeholder="Type your message..."
      /> */}
      {/* <button onClick={sendMessage}>Send</button> */}
    </div>
  </div>
);
  return <div>

  </div>
}

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
      <div className='px-2'>
        <img  onClick={() => {
        setShowAI(v => !v);
        }}
        className='w-6 h-6 hover:scale-125 cursor-pointer' src='/imgs/ai.png'/>
      </div>
      {showAI && (
        <div className="fixed p-2 z-50 left-1 top-[60px] h-[90vh] w-[360px] bg-white rounded-lg shadow-xl flex flex-col">
          <div className="flex">
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
          {/* <div id="chatbox" className="chatbox"> */}
            
            {/* <iframe title="chatbox" src="https://digitalautodev.app.n8n.cloud/webhook/1a8ae71f-42d7-4bb0-946d-bdc095ed1a2f/chat"/> */}
          {/* </div> */}
        </div>
      )}
    </>
  )
}

export default ChatBox
