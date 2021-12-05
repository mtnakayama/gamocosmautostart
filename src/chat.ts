import is from 'is';  // is.js

import { clone } from './clone.js';


export interface Chat {
    color?: string;
    text?: string;
    obfuscated?: boolean;
    selector?: string;
    extra?: Array<Chat>
}

export function toChat(message: string | Chat): Chat {
    if(is.string(message)) {
        return { text: message as string };
    } else {
        return message as Chat;  // assume already in chat form
    };
}

export function replacePlayerSelector(chat: Chat, replacement: string): Chat {
    return replaceSelectors(chat, {'@p': replacement});
}

/**
 *
 * @param replacements a mapping of selector => replacement
 *
 */
export function replaceSelectors(chat: Chat,
        replacements: Record<string, string>): Chat {

    const newChat = clone(chat);
    replaceSelectorsRecursive(newChat, replacements);
    return newChat;
}

function replaceSelectorsRecursive(chat: Chat,
        replacements: Record<string, string>): void {

    const selector = chat.selector
    if(selector !== undefined) {
        const replace = replacements[selector];
        if(replace !== undefined) {
            chat.selector = undefined;
            chat.text = replace;
        }
    }
    if(chat.extra !== undefined) {
        chat.extra.forEach(x => replaceSelectorsRecursive(x, replacements));
    }
}
