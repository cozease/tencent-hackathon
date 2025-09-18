import OpenAI from "openai";

interface JourneyEvent {
  encounter: string;
  choice: string;
}

interface ReviewRequest {
  journeyLog: JourneyEvent[];
  unlockedGallery: string[];
}

export default defineEventHandler(async (event) => {
  const { journeyLog, unlockedGallery } = await readBody<ReviewRequest>(event);

  const config = useRuntimeConfig();

  if (!config.openaiApiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: "OpenAI API key not configured",
    });
  }

  const openai = new OpenAI({
    baseURL: config.openaiBaseUrl,
    apiKey: config.openaiApiKey,
  });

  // 构建journey_log部分
  const journeyLogXml = journeyLog
    .map(
      (evt) =>
        `        <event>
            <encounter>${evt.encounter}</encounter>
            <choice>${evt.choice}</choice>
        </event>`
    )
    .join("\n");

  // 构建unlocked_gallery部分
  const unlockedGalleryList = unlockedGallery
    .map((item) => `        - ${item}`)
    .join("\n");

  // 构建完整的prompt
  const prompt = `<role>
你是一位专业的自然科普作家，同时也是一款森林探索游戏的AI向导。你的写作风格亲切、睿智且充满感染力。你的核心任务是为玩家的每一次森林探索生成一段独特的、个性化的行程回顾。
</role>

<instructions>
你的输出必须严格遵循以下规则：
1.  你的输出内容**只能是**行程回顾本身。禁止添加任何标题（如"行程回顾"）、前言（如"这是您的回顾："）或任何其它无关的文本。
2.  回顾的开头应该直接描述本次旅程的独特之处。
3.  **你的口吻需要融入故事氛围**。在赞美和建议时，可以巧妙地暗示：玩家对细节的敏锐观察和对森林的尊重，或许正是揭开此地更深层秘密（如神秘白兽之谜）的关键。
4.  深入分析玩家在 <player_choices> 中记录的行为。
    -   对于积极的、符合生态保护原则的选择，要给予具体而真诚的赞扬，并点明这些行为对自然的益处。
    -   对于可能对生态造成影响的选择，要以富有同理心和建设性的方式提出建议，解释为什么另一种做法会更好，而不是批评。
5.  将 <unlocked_gallery> 中的新发现巧妙地编织到回顾文本中，让它们成为旅程中的闪光点。
6.  回顾的整体基调应该是积极的、鼓舞人心的，旨在提升玩家的生态意识，并号召他们成为自然的朋友。
7.  在回顾的倒数第二段，你需要根据玩家的行程经历和所做的选择，为玩家颁发一个称号（如"森林探险家"、"生态守护者"等）。
8.  回顾的**最后一段必须且只能是**："一起去微信"野朋友计划"小程序，发现和认识身边的物种，切身参与到生物多样性保护中吧！"
</instructions>

<player_data>
    <journey_log>
${journeyLogXml}
    </journey_log>
    <unlocked_gallery>
${unlockedGalleryList}
    </unlocked_gallery>
</player_data>

<output_format>
以纯文本格式直接生成符合上述所有要求的行程回顾文本。
</output_format>`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: prompt,
        },
      ],
      model: config.openaiModel,
      temperature: 0.8,
      max_tokens: 800,
    });

    const review = completion.choices[0].message.content;

    return {
      success: true,
      review: review,
    };
  } catch (error) {
    console.error("Error generating review:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    throw createError({
      statusCode: 500,
      statusMessage: "Failed to generate review: " + errorMessage,
    });
  }
});
