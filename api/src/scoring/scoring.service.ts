import { Injectable } from '@nestjs/common';

export type SkillKey = 'Communication' | 'Problem Solving' | 'Empathy';

export type SkillScore = {
  skill: SkillKey;
  score: number;
  explanation: string;
};

export type FeedbackResult = {
  skills: SkillScore[];
  overallSummary: string;
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function wordCount(s: string) {
  const m = s.trim().match(/\S+/g);
  return m ? m.length : 0;
}

@Injectable()
export class ScoringService {
  analyze(_questions: string[], answers: string[]): FeedbackResult {
    const combined = answers.join(' ').trim();
    const totalWords = wordCount(combined);

    const comm = this.scoreCommunication(answers, totalWords);
    const ps = this.scoreProblemSolving(answers);
    const emp = this.scoreEmpathy(answers);

    const skills: SkillScore[] = [
      {
        skill: 'Communication',
        score: comm,
        explanation: this.explainCommunication(comm, answers),
      },
      {
        skill: 'Problem Solving',
        score: ps,
        explanation: this.explainProblemSolving(ps, answers),
      },
      {
        skill: 'Empathy',
        score: emp,
        explanation: this.explainEmpathy(emp),
      },
    ];

    const overallSummary = this.buildOverallSummary(skills, totalWords);
    return { skills, overallSummary };
  }

  private scoreCommunication(answers: string[], totalWords: number) {
    const avgLen = answers.length ? totalWords / answers.length : 0;
    const hasStructure = answers.some((a) => /first|second|then|finally|because|so that/i.test(a));
    const score = 40 + avgLen * 3 + (hasStructure ? 12 : 0);
    return clamp(Math.round(score), 0, 100);
  }

  private scoreProblemSolving(answers: string[]) {
    const keywords = ['tradeoff', 'step', 'plan', 'approach', 'because', 'therefore', 'measure', 'iterate', 'debug'];
    const hitCount = keywords.reduce((acc, k) => {
      const re = new RegExp(`\\b${k}\\b`, 'i');
      return acc + (answers.some((a) => re.test(a)) ? 1 : 0);
    }, 0);

    const mentionsConcrete = answers.some((a) => /\b(example|for instance|case|metric|log|test)\b/i.test(a));
    const score = 35 + hitCount * 7 + (mentionsConcrete ? 12 : 0);
    return clamp(Math.round(score), 0, 100);
  }

  private scoreEmpathy(answers: string[]) {
    const empathyWords = ['understand', 'feel', 'listen', 'support', 'help', 'care', 'collaborate', 'respect', 'feedback'];
    const hits = empathyWords.reduce((acc, k) => {
      const re = new RegExp(`\\b${k}\\b`, 'i');
      return acc + (answers.some((a) => re.test(a)) ? 1 : 0);
    }, 0);

    const avoidsBlame = answers.some((a) => /\bwe\b/i.test(a)) && !answers.some((a) => /\byou always\b/i.test(a));
    const score = 30 + hits * 8 + (avoidsBlame ? 10 : 0);
    return clamp(Math.round(score), 0, 100);
  }

  private buildOverallSummary(skills: SkillScore[], totalWords: number) {
    const best = [...skills].sort((a, b) => b.score - a.score)[0];
    const weakest = [...skills].sort((a, b) => a.score - b.score)[0];

    const verbosityHint =
      totalWords < 120
        ? 'Consider adding a bit more detail in future answers so your reasoning is easier to evaluate.'
        : totalWords > 600
          ? 'Your answers are detailed. In future, try tightening a few responses to keep the key points crisp.'
          : 'Your answer length is in a good range for a short chat interview.';

    return `Strongest area: ${best.skill}. Area to improve: ${weakest.skill}. ${verbosityHint}`;
  }

  private explainCommunication(score: number, answers: string[]) {
    const hasShort = answers.some((a) => wordCount(a) < 12);
    if (score >= 80) return 'Your answers were clear and easy to follow, with helpful structure and context.';
    if (score >= 60) return hasShort
      ? 'You communicated the main points, but a few answers were very short. Adding one extra sentence of context would help.'
      : 'You communicated the main points well. Slightly more structure would make it even clearer.';
    return 'Your answers were hard to evaluate because they lacked clarity or enough context. Try using 1 to 2 concrete examples.';
  }

  private explainProblemSolving(score: number, answers: string[]) {
    const mentionsSteps = answers.some((a) => /first|then|finally|step/i.test(a));
    if (score >= 80) return 'You described a practical approach, including tradeoffs or steps, which shows strong problem solving.';
    if (score >= 60) return mentionsSteps
      ? 'You showed a reasonable approach. Adding a metric, test, or validation step would make it stronger.'
      : 'You showed reasonable thinking. Try outlining steps and how you would validate the result.';
    return 'Your answers did not show enough reasoning steps. Try explaining your approach and how you would test it.';
  }

  private explainEmpathy(score: number) {
    if (score >= 80) return 'You showed awareness of other perspectives and described supportive, collaborative behavior.';
    if (score >= 60) return 'You showed some collaborative thinking. Adding how you listen and respond to feedback would help.';
    return 'Your answers did not clearly show how you collaborate or support others. Try describing how you handle disagreements respectfully.';
  }
}
