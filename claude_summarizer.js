import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic({
    // defaults to process.env["ANTHROPIC_API_KEY"]
    //apiKey: "my_api_key",
});

export const sanitize = (text) => {
    return (text ?? "").replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export const ask_llm = async (thread_name, thread_text) => {
    const payload = {
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1000,
        temperature: 0,
        messages: [
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": `You are tasked with summarizing an excerpt of a Discord thread into one short sentence in Czech. Here is the Discord thread content:\n\n<discord_thread>\n<thread_name>${thread_name}</thread_name>\n${thread_text}\n</discord_thread>\n\nYour goal is to create a concise summary that captures the main topic or interaction of the thread in a single Czech sentence. Follow these guidelines:\n\n1. Include user names if appropriate, mark them bold with **. For example: \"**Pepa** a **Honza** si povídají o kočičkách.\"\n\n2. You may include an emoji at the end of the sentence if it's relevant to the topic, but use them sparingly. Don't overuse emojis. No chess emoji (unless the thread is about chess in particular).\n\n3. Keep the tone somewhat informal, as it's a summary of a Discord conversation.\n\n4. Ensure your summary is grammatically correct Czech.\n\n5. If the number of people in the thread is bigger, shorten the citations to few salient participants plus an addititonal explanatory text. For example \"**Hidoshito**, **Karel** a další si povídají o rajčatech.\" If there are no main people in the discussion, no citations are necessary, for example \"Obecná diskuse o pravidlech Go\". No problem having citation with 1 or 2 users. Citation is always better than "Někdo ..." or "Uživatel píše..."\n\nHere are some examples of good summaries:\n- \"**JanNovak** a **Petr Svoboda** diskutují o nejnovějším filmu Marvel. 🎬\"\n- \"**Marie** sdílí recept na domácí chleba a ostatní přidávají své tipy.\"\n- \"**TomášNěmec** se ptá na rady ohledně pěstování rajčat na balkóně. 🍅\"\n- \"Diskuse o vztahu ČAGO a našeho discordu.\"\n\nBefore providing your final answer, use the <scratchpad> tags to think through your summary. Consider the main topic of discussion, the users involved, and whether an emoji would be appropriate.\n\nProvide your final summary in Czech within <summary> tags.`
                    }
                ]
            }
        ]
    };
    console.log(JSON.stringify(payload, null, 2));
    const msg = await anthropic.messages.create(payload);

    const txt = (msg?.content ?? [])[0]?.text ?? "";

    const summaryMatch = txt.match(/<summary>(.*?)<\/summary>/s);
    let summary = summaryMatch ? summaryMatch[1].trim() : null
    summary = summary?.replace(/@everyone/g, '**\\@ everyone**');
    summary = summary?.replace(/@here/g, '**\\@ here**');
    return summary;
}
