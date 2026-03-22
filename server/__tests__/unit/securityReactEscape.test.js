/**
 * Verifies React’s default escaping for text children (same pattern as user chat
 * lines rendered via MUI Typography with string content).
 */
import { describe, test, expect } from '@jest/globals'
import { renderToStaticMarkup } from 'react-dom/server'
import { createElement } from 'react'

describe('security XSS escape (React default text escaping)', () => {
    test('escapes script-like markup in element text children', () => {
        const html = renderToStaticMarkup(
            createElement('span', null, '<script>alert(1)</script><img src=x onerror=alert(1)>')
        )
        expect(html).toContain('&lt;script&gt;')
        expect(html).toContain('&lt;img')
        expect(html).not.toMatch(/<script[^>]*>/)
        expect(html).not.toContain('<img ')
    })
})
