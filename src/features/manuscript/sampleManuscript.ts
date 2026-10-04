import type { Manuscript } from '../../types/manuscript';

export const sampleManuscript: Manuscript = {
  id: 'manuscript-chatgpt-guide',
  title: 'ChatGPT를 잘 활용하는 방법',
  subtitle: '기능 확인용 임시 원고 · 3개 장 / 12개 절',
  updatedAt: new Date().toISOString(),
  chapters: [
    {
      id: 'ch-1',
      title: '1장. ChatGPT를 제대로 이해하기',
      sections: [
        {
          id: 'sec-1-1',
          title: '1-1 절. ChatGPT는 무엇을 잘하는가',
          fileName: '01-01-what-chatgpt-does-well.md',
          blocks: [
            { id: 'block_sample_1_1_1', type: 'paragraph', text: 'ChatGPT를 잘 활용하려면 먼저 이 도구가 무엇을 잘하는지 이해해야 한다. ChatGPT는 정보를 정리하고, 아이디어를 확장하고, 초안을 만들고, 복잡한 내용을 쉽게 설명하는 데 강하다.' },
            { id: 'block_sample_1_1_2', type: 'paragraph', text: '특히 사용자가 목적과 조건을 분명하게 제시할수록 더 쓸모 있는 결과를 얻을 수 있다. 막연한 질문보다는 원하는 결과물의 형태를 함께 알려주는 것이 좋다.' },
            { id: 'block_sample_1_1_3', type: 'quote', text: '좋은 답변은 좋은 질문만으로 만들어지는 것이 아니라, 좋은 맥락에서 만들어진다.' },
            { id: 'block_sample_1_1_4', type: 'paragraph', text: '따라서 ChatGPT를 단순한 검색창이 아니라 생각을 함께 정리하는 도구로 바라보는 것이 활용의 출발점이다.' },
          ],
        },
        {
          id: 'sec-1-2',
          title: '1-2 절. 질문보다 중요한 것은 맥락이다',
          fileName: '01-02-context-matters.md',
          blocks: [
            { id: 'block_sample_1_2_1', type: 'paragraph', text: '같은 질문이라도 어떤 상황에서 필요한 답인지에 따라 좋은 답의 기준은 달라진다. 업무용 문서와 친구에게 보내는 메시지는 같은 내용이어도 표현 방식이 전혀 다르다.' },
            { id: 'block_sample_1_2_2', type: 'paragraph', text: '질문을 할 때는 현재 상황, 대상, 목적, 이미 시도한 방법을 함께 알려주는 것이 좋다. 이 정보들이 답변의 방향을 결정한다.' },
            { id: 'block_sample_1_2_3', type: 'paragraph', text: '예를 들어 “메일을 써줘”보다 “거래처에 일정 변경을 정중하게 알리는 짧은 메일을 써줘”라고 요청하면 훨씬 바로 사용할 수 있는 결과가 나온다.' },
          ],
        },
        {
          id: 'sec-1-3',
          title: '1-3 절. 한 번에 완벽한 답을 기대하지 않기',
          fileName: '01-03-iterate-with-chatgpt.md',
          blocks: [
            { id: 'block_sample_1_3_1', type: 'paragraph', text: 'ChatGPT와의 대화는 한 번의 질문으로 끝나는 검색보다 여러 번 다듬는 작업에 가깝다. 첫 답변은 완성본이라기보다 방향을 잡는 초안으로 생각하는 편이 좋다.' },
            { id: 'block_sample_1_3_2', type: 'paragraph', text: '마음에 들지 않는 부분이 있다면 처음부터 다시 요청하기보다 무엇이 아쉬운지 구체적으로 알려주자. 길이, 어조, 난이도, 구성 중 어떤 점을 바꾸고 싶은지 말하면 된다.' },
            { id: 'block_sample_1_3_3', type: 'paragraph', text: '이 과정을 반복하면 ChatGPT는 사용자가 원하는 기준에 점점 가까운 결과를 만들 수 있다.' },
          ],
        },
        {
          id: 'sec-1-4',
          title: '1-4 절. 사실과 아이디어를 구분하기',
          fileName: '01-04-facts-and-ideas.md',
          blocks: [
            { id: 'block_sample_1_4_1', type: 'paragraph', text: 'ChatGPT의 답변에는 사실 정보와 창의적인 제안이 함께 섞여 있을 수 있다. 아이디어를 얻는 데는 유용하지만 중요한 사실은 별도로 확인하는 습관이 필요하다.' },
            { id: 'block_sample_1_4_2', type: 'paragraph', text: '특히 법률, 의료, 금융, 최신 뉴스처럼 정확성과 시점이 중요한 분야에서는 출처와 날짜를 확인해야 한다.' },
            { id: 'block_sample_1_4_3', type: 'paragraph', text: '반대로 제목 후보, 글의 구조, 브레인스토밍처럼 정답이 하나가 아닌 작업에서는 다양한 가능성을 빠르게 탐색하는 데 큰 장점이 있다.' },
          ],
        },
      ],
    },
    {
      id: 'ch-2',
      title: '2장. 원하는 답을 얻는 요청법',
      sections: [
        {
          id: 'sec-2-1',
          title: '2-1 절. 목적을 먼저 말하기',
          fileName: '02-01-state-the-goal.md',
          blocks: [
            { id: 'block_sample_2_1_1', type: 'paragraph', text: '좋은 요청은 작업 내용보다 목적에서 시작한다. 무엇을 만들어야 하는지뿐 아니라 왜 필요한지를 알려주면 결과의 우선순위가 달라진다.' },
            { id: 'block_sample_2_1_2', type: 'paragraph', text: '예를 들어 “이 문장을 줄여줘”라는 요청에 “전시회 배너에 들어갈 문장이라 멀리서도 읽혀야 해”라는 목적을 덧붙이면 짧고 강한 문장을 제안하기 쉬워진다.' },
            { id: 'block_sample_2_1_3', type: 'quote', text: '목적은 답변이 어디를 향해야 하는지 알려주는 나침반과 같다.' },
          ],
        },
        {
          id: 'sec-2-2',
          title: '2-2 절. 조건을 구체적으로 정하기',
          fileName: '02-02-set-constraints.md',
          blocks: [
            { id: 'block_sample_2_2_1', type: 'paragraph', text: '결과물에 반드시 지켜야 할 조건이 있다면 처음부터 명시하는 것이 좋다. 글자 수, 대상 독자, 금지 표현, 형식, 포함해야 할 항목 등이 조건에 해당한다.' },
            { id: 'block_sample_2_2_2', type: 'paragraph', text: '조건이 많을 때는 문장 안에 모두 섞기보다 목록으로 정리하면 누락을 줄일 수 있다.' },
            { id: 'block_sample_2_2_3', type: 'paragraph', text: '다만 너무 많은 조건을 한 번에 주면 핵심이 흐려질 수 있으므로 반드시 필요한 조건부터 우선순위를 정하는 것이 좋다.' },
          ],
        },
        {
          id: 'sec-2-3',
          title: '2-3 절. 예시를 보여주기',
          fileName: '02-03-use-examples.md',
          blocks: [
            { id: 'block_sample_2_3_1', type: 'paragraph', text: '원하는 스타일을 말로 설명하기 어렵다면 예시를 보여주는 것이 가장 빠르다. 기존 문장, 참고 자료, 좋아하는 구성 등을 함께 제공할 수 있다.' },
            { id: 'block_sample_2_3_2', type: 'paragraph', text: '예시는 그대로 복제하라는 뜻이 아니라 결과물이 가져야 할 분위기와 기준을 전달하는 역할을 한다.' },
            { id: 'block_sample_2_3_3', type: 'paragraph', text: '“이 예시처럼 간결하지만 내용은 새롭게 작성해줘”처럼 참고할 부분과 바꾸어야 할 부분을 구분해서 말하면 더 안전하다.' },
          ],
        },
        {
          id: 'sec-2-4',
          title: '2-4 절. 역할과 출력 형식을 지정하기',
          fileName: '02-04-role-and-format.md',
          blocks: [
            { id: 'block_sample_2_4_1', type: 'paragraph', text: '복잡한 작업에서는 ChatGPT에게 어떤 관점으로 판단해야 하는지 역할을 지정하면 도움이 된다. 예를 들어 편집자, 기획자, 개발자, 면접관의 관점은 서로 다른 기준을 사용한다.' },
            { id: 'block_sample_2_4_2', type: 'paragraph', text: '출력 형식도 함께 지정할 수 있다. 표, 체크리스트, 단계별 설명, 코드, 짧은 요약 등 이후 사용할 방식에 맞춰 요청하면 후처리 시간이 줄어든다.' },
            { id: 'block_sample_2_4_3', type: 'paragraph', text: '역할 지정은 전문성을 자동으로 보장하는 장치라기보다 답변의 관점과 구조를 정돈하는 방법으로 사용하는 것이 적절하다.' },
          ],
        },
      ],
    },
    {
      id: 'ch-3',
      title: '3장. 실전에서 ChatGPT 활용하기',
      sections: [
        {
          id: 'sec-3-1',
          title: '3-1 절. 글쓰기와 퇴고에 활용하기',
          fileName: '03-01-writing-and-editing.md',
          blocks: [
            { id: 'block_sample_3_1_1', type: 'paragraph', text: '글쓰기에서는 처음부터 완성된 문장을 부탁하기보다 아이디어 정리, 목차 구성, 초안 작성, 퇴고처럼 작업을 여러 단계로 나누면 좋다.' },
            { id: 'block_sample_3_1_2', type: 'paragraph', text: '퇴고할 때는 “더 좋게 고쳐줘”보다 무엇을 개선할지 지정한다. 문장 호흡, 중복 표현, 논리 연결, 어조, 독자 이해도 등을 따로 점검할 수 있다.' },
            { id: 'block_sample_3_1_3', type: 'paragraph', text: '원문을 보존하면서 수정 제안을 별도로 받아 비교하면 작성자의 의도를 잃지 않으면서 문장을 개선하기 쉽다.' },
          ],
        },
        {
          id: 'sec-3-2',
          title: '3-2 절. 업무와 자료 정리에 활용하기',
          fileName: '03-02-work-and-organization.md',
          blocks: [
            { id: 'block_sample_3_2_1', type: 'paragraph', text: '업무에서는 긴 회의 내용이나 자료를 핵심 항목으로 정리하고, 해야 할 일을 추출하고, 문서의 초안을 만드는 데 활용할 수 있다.' },
            { id: 'block_sample_3_2_2', type: 'paragraph', text: '같은 자료라도 보고용 요약, 실무자용 체크리스트, 발표용 문장처럼 목적에 따라 다른 결과물로 변환할 수 있다.' },
            { id: 'block_sample_3_2_3', type: 'paragraph', text: '민감한 회사 정보나 개인정보를 다룰 때는 조직의 보안 정책과 사용 규칙을 먼저 확인해야 한다.' },
          ],
        },
        {
          id: 'sec-3-3',
          title: '3-3 절. 공부와 학습에 활용하기',
          fileName: '03-03-learning-with-chatgpt.md',
          blocks: [
            { id: 'block_sample_3_3_1', type: 'paragraph', text: '학습에서는 모르는 내용을 단순히 대신 풀게 하기보다 이해를 돕는 튜터처럼 활용하는 편이 효과적이다.' },
            { id: 'block_sample_3_3_2', type: 'paragraph', text: '어려운 개념을 쉬운 말로 설명하게 하거나, 예시를 추가하거나, 자신의 이해가 맞는지 질문하면서 능동적으로 대화를 이어갈 수 있다.' },
            { id: 'block_sample_3_3_3', type: 'paragraph', text: '마지막에는 요약을 읽는 데서 끝내지 말고 스스로 설명해 보거나 문제를 풀어보며 실제로 이해했는지 확인하는 과정이 필요하다.' },
          ],
        },
        {
          id: 'sec-3-4',
          title: '3-4 절. 나만의 활용 방식을 만들기',
          fileName: '03-04-build-your-workflow.md',
          blocks: [
            { id: 'block_sample_3_4_1', type: 'paragraph', text: 'ChatGPT를 오래 사용할수록 중요한 것은 유명한 프롬프트를 외우는 일이 아니라 자신에게 잘 맞는 사용 흐름을 만드는 일이다.' },
            { id: 'block_sample_3_4_2', type: 'paragraph', text: '자주 반복하는 작업이 있다면 좋은 요청문을 템플릿으로 저장하고, 결과를 평가하는 기준도 함께 정리해 둘 수 있다.' },
            { id: 'block_sample_3_4_3', type: 'paragraph', text: '결국 가장 좋은 활용법은 ChatGPT에게 모든 판단을 맡기는 것이 아니라, 사람이 목적과 기준을 정하고 AI가 탐색과 제작을 빠르게 돕도록 역할을 나누는 것이다.' },
            { id: 'block_sample_3_4_4', type: 'quote', text: 'AI를 잘 쓰는 사람은 질문을 많이 하는 사람이 아니라, 원하는 결과의 기준을 분명히 아는 사람이다.' },
          ],
        },
      ],
    },
  ],
};
