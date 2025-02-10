

export function createAtomicCardsPrompt(content: string) {
    return `请基于卡片笔记法原子化的原则，帮我将下面的内容拆为多个卡片（不要过于琐碎）。
  注意你只负责拆分，不要修改内容。你可以将关联性较强的内容放在一起。
  这是草稿内容，后续我会自行完善。
  
  内容：
  ${content}

输出格式：
 <content>
[原子化内容]
</content>
<content>
[原子化内容]
</content>
...

  `;
}
