import type {GeographyQuestion} from './questions';

export type QuizOptionOrder = {
  quiz_revision?:number;
  option_orders?:number[][];
};

export function visibleChoices(question:GeographyQuestion,attempt:QuizOptionOrder|null) {
  const questionIndex=Number(question.id.slice(-2))-1;
  const serverOrder=attempt?.quiz_revision===2?attempt.option_orders?.[questionIndex]:undefined;
  const valid=Array.isArray(serverOrder)
    &&serverOrder.length===3
    &&serverOrder.every(n=>Number.isInteger(n)&&n>=0&&n<=2)
    &&new Set(serverOrder).size===3;
  // Do not silently fall back to the old predictable order in live quizzes.
  if(attempt?.quiz_revision===2&&!valid)throw new Error('Falta la distribución de respuestas. Vuelve a abrir el test.');
  const order=valid?serverOrder!:[0,1,2];
  return {
    options:order.map(i=>question.options[i]) as [string,string,string],
    correct:order.indexOf(question.correct) as 0|1|2,
    order,
  };
}
