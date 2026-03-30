import { useState } from 'react'
import { InputArea } from './InputArea'

/**
 * Keeps draft text in local state so typing does not re-render the whole chat page.
 * Parent can remount with a new `key` and `initialDraft` to apply a sample question.
 */
export function ChatDraftInput({
    onSend,
    loading,
    streamingResponse,
    initialDraft = '',
}) {
    const [draft, setDraft] = useState(initialDraft)

    const handleSend = async () => {
        const t = draft.trim()
        if (!t) return
        await onSend(t)
        setDraft('')
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            void handleSend()
        }
    }

    return (
        <InputArea
            message={draft}
            loading={loading}
            streamingResponse={streamingResponse}
            onMessageChange={(e) => setDraft(e.target.value)}
            onSendMessage={handleSend}
            onKeyPress={handleKeyDown}
        />
    )
}
