import { useState, useRef } from 'react'

/** 3.3.1 — Enregistrement micro : démarre/arrête un MediaRecorder et livre le blob obtenu. */
export function useAudioRecorder() {
  const [isRecording, setIsRecording] = useState(false)
  const mediaRef = useRef(null)
  const chunksRef = useRef([])

  const startRecording = async (onStop) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const recorder = new MediaRecorder(stream)
    chunksRef.current = []

    recorder.ondataavailable = e => {
      if (e.data.size > 0) chunksRef.current.push(e.data)
    }

    recorder.onstop = async () => {
      stream.getTracks().forEach(t => t.stop())
      setIsRecording(false)
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      await onStop(blob)
    }

    recorder.start()
    mediaRef.current = recorder
    setIsRecording(true)
  }

  const stopRecording = () => {
    mediaRef.current?.stop()
  }

  return { isRecording, startRecording, stopRecording }
}
