import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageSquare, Volume2, ChevronDown, ChevronUp, Sparkles, Mic, MicOff, Send, Bot, User } from 'lucide-react'
import { getMessages, createMessage, processMessage } from '../services/api'
import styles from './Conversation.module.css'

export default function Conversation() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([])
  const [inputText, setInputText] = useState('')
  const [loading, setLoading] = useState(false)
  const [activeMsg, setActiveMsg] = useState(null)
  const [userProfile, setUserProfile] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const [recordingSupported, setRecordingSupported] = useState(false)
  const bottomRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    getMessages(id).then(setMessages)
    // Load user profile for language info
    const loadProfile = async () => {
      try {
        const { getProfile } = await import('../services/api')
        const profile = await getProfile()
        setUserProfile(profile)
      } catch (error) {
        console.error('Failed to load profile')
      }
    }
    loadProfile()
    
    // Check if Speech Recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
      const recognition = new SpeechRecognition()
      recognition.continuous = false
      recognition.interimResults = true
      recognition.lang = userProfile?.native_language || 'fr-FR'
      
      recognition.onresult = (event) => {
        let finalTranscript = ''
        let interimTranscript = ''
        
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript
          if (event.results[i].isFinal) {
            finalTranscript += transcript
          } else {
            interimTranscript += transcript
          }
        }
        
        if (finalTranscript) {
          setInputText(finalTranscript)
          setIsRecording(false)
        } else if (interimTranscript) {
          setInputText(interimTranscript)
        }
      }
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error)
        setIsRecording(false)
        alert('Erreur de reconnaissance vocale: ' + event.error)
      }
      
      recognition.onend = () => {
        setIsRecording(false)
      }
      
      recognitionRef.current = recognition
      setRecordingSupported(true)
    }
  }, [id, userProfile])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const processText = async (text) => {
    if (!text.trim()) return
    setLoading(true)

    try {
      // Use AI processing endpoint
      const response = await processMessage({
        conversation_id: parseInt(id),
        original_text: text
      })

      // Add both user and assistant messages
      setMessages(prev => [
        ...prev,
        response.userMessage,
        {
          id: response.assistantMessage.id,
          role: 'assistant',
          original_text: response.assistantMessage.original_text,
          translated_text: response.assistantMessage.translated_text,
          explanation: response.assistantMessage.explanation
        }
      ])
    } catch (error) {
      console.error('Error processing message:', error)
    }
    
    setLoading(false)
  }

  const handleSend = () => {
    processText(inputText)
    setInputText('')
  }

  const toggleRecording = () => {
    if (!recognitionRef.current) {
      alert('La reconnaissance vocale n\'est pas supportée par votre navigateur')
      return
    }
    
    if (isRecording) {
      recognitionRef.current.stop()
      setIsRecording(false)
    } else {
      // Update language based on user profile
      recognitionRef.current.lang = userProfile?.native_language || 'fr-FR'
      recognitionRef.current.start()
      setIsRecording(true)
    }
  }

  const handleSpeak = (text, language) => {
    // Use browser's SpeechSynthesis API for text-to-speech
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel() // Stop any current speech
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = language || 'en-US'
      utterance.rate = 0.9 // Slightly slower for language learning
      utterance.pitch = 1
      
      window.speechSynthesis.speak(utterance)
    } else {
      alert('La synthèse vocale n\'est pas supportée par votre navigateur')
    }
  }

  const toggleExplanation = (msgId) => {
    setActiveMsg(activeMsg === msgId ? null : msgId)
  }

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <button className={styles.back} onClick={() => navigate('/dashboard')}>
          <ArrowLeft size={18} />
          <span>Retour</span>
        </button>
        <div className={styles.headerTitle}>
          <Sparkles size={24} />
          <span>Lingua Coach — Conversation</span>
        </div>
      </header>

      {/* Messages */}
      <div className={styles.messages}>
        {messages.length === 0 && !loading && (
          <div className={styles.welcome}>
            <div className={styles.welcomeIcon}>
              <MessageSquare size={64} />
            </div>
            <h2>Commencez à parler !</h2>
            <p>Tapez votre message ou utilisez le microphone pour parler.</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={msg.id || i} className={`${styles.msgWrap} ${msg.role === 'user' ? styles.userWrap : styles.assistantWrap}`}>
            {msg.role === 'user' ? (
              <div className={styles.userBubble}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <User size={16} color="white" />
                  <span style={{ fontSize: '12px', fontWeight: '700', opacity: '0.9' }}>Vous</span>
                </div>
                <div className={styles.original}>{msg.original_text}</div>
                {msg.translated_text && (
                  <>
                    <div className={styles.translation}>
                      <strong>Traduction:</strong> {msg.translated_text}
                    </div>
                    <button 
                      className={styles.speakBtn}
                      onClick={() => handleSpeak(msg.original_text, userProfile?.native_language)}
                      title="Écouter"
                    >
                      <Volume2 size={16} />
                    </button>
                  </>
                )}
              </div>
            ) : (
              <div className={styles.assistantBubble}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <Bot size={16} color="#FCD34D" />
                  <span style={{ fontSize: '12px', fontWeight: '700', color: '#FCD34D' }}>Lingua Coach</span>
                </div>
                <div className={styles.original}>
                  <Sparkles size={16} className={styles.aiIcon} />
                  {msg.original_text}
                </div>
                {msg.translated_text && (
                  <>
                    <div className={styles.translation}>
                      <strong>Traduction:</strong> {msg.translated_text}
                    </div>
                    <button 
                      className={styles.speakBtn}
                      onClick={() => handleSpeak(msg.original_text, userProfile?.target_language)}
                      title="Écouter"
                    >
                      <Volume2 size={16} />
                    </button>
                  </>
                )}
                {msg.explanation && (
                  <>
                    <button 
                      className={styles.explainToggle}
                      onClick={() => toggleExplanation(msg.id)}
                    >
                      {activeMsg === msg.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                      {activeMsg === msg.id ? 'Masquer l\'explication' : 'Voir l\'explication'}
                    </button>
                    {activeMsg === msg.id && (
                      <div className={styles.explanation}>
                        {msg.explanation}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className={styles.assistantWrap}>
            <div className={styles.assistantBubble}>
              <div className={styles.typing}>
                <span></span><span></span><span></span>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className={styles.inputArea}>
        <input
          className={styles.textInput}
          type="text"
          placeholder="Écrivez ou parlez en français ou dans votre langue..."
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          disabled={loading}
        />
        {recordingSupported && (
          <button
            className={`${styles.micBtn} ${isRecording ? styles.micRecording : ''}`}
            onClick={toggleRecording}
            disabled={loading}
            title={isRecording ? 'Arrêter l\'enregistrement' : 'Commencer l\'enregistrement'}
          >
            {isRecording ? <MicOff size={20} /> : <Mic size={20} />}
          </button>
        )}
        <button
          className={styles.sendBtn}
          onClick={handleSend}
          disabled={loading || !inputText.trim()}
        >
          <Send size={18} />
          <span style={{ marginLeft: '8px' }}>Envoyer</span>
        </button>
      </div>
    </div>
  )
}

