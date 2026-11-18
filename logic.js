import {options} from './schema.js?v=4';
export const VERSION = 'music-healing-survey-a/v2';
export const ageRange = {min: 18, max: 65};
export const previousMaxAge = 120;
export function noStressListening(answers) {
  return ['never','no_stress'].includes(answers.stress_frequency);
}
export function validAnswer(field, answers, {maxAge = ageRange.max} = {}) {
  const value = answers[field.key];
  const empty = value === null || value === undefined || value === '';
  if (field.key === 'genre_like' && answers.stress_genre === 'none') return empty;
  if (empty) return !field.required;
  if (field.type === 'scale') return Number.isInteger(value) && value >= 0 && value <= 10;
  if (field.type === 'number') {
    const [min,max] = field.key === 'age' ? [ageRange.min,maxAge] : [0,1440];
    return Number.isInteger(value) && value >= min && value <= max;
  }
  if (field.key === 'stress_genre' && noStressListening(answers) !== (value === 'none')) return false;
  return options[field.options].some(option => option[0] === value);
}
export const detailLimits = {participant_name: 100, feedback: 1000};

export function makePayload(answers, language, input = {}) {
  const details = {};
  for (const [key, limit] of Object.entries(detailLimits)) {
    const value = (input[key] ?? '').trim().slice(0, limit);
    if (value) details[key] = value;
  }
  return {
    schema: VERSION,
    id: crypto.randomUUID(),
    submittedAt: new Date().toISOString(),
    language,
    consent: true,
    answers: {...answers},
    details
  };
}
