import {options} from './schema.js';
export const VERSION = 'music-healing-survey-a/v2';
export function noStressListening(answers) {
  return ['never','no_stress'].includes(answers.stress_frequency);
}
export function validAnswer(field, answers) {
  const value = answers[field.key];
  const empty = value === null || value === undefined || value === '';
  if (field.key === 'genre_like' && answers.stress_genre === 'none') return empty;
  if (empty) return !field.required;
  if (field.type === 'scale') return Number.isInteger(value) && value >= 0 && value <= 10;
  if (field.type === 'number') {
    const [min,max] = field.key === 'age' ? [18,120] : [0,1440];
    return Number.isInteger(value) && value >= min && value <= max;
  }
  if (field.key === 'stress_genre' && noStressListening(answers) !== (value === 'none')) return false;
  return options[field.options].some(option => option[0] === value);
}
export function makePayload(answers,language) {
  return {schema:VERSION,id:crypto.randomUUID(),submittedAt:new Date().toISOString(),language,consent:true,answers:{...answers}};
}
