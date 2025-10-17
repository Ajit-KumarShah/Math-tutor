
import { EDUCATION_LEVELS, MATH_TOPICS } from './constants';

export type EducationLevel = typeof EDUCATION_LEVELS[number];
export type MathTopic = typeof MATH_TOPICS[number];

export enum Role {
  USER = 'user',
  MODEL = 'model',
}

export interface Message {
  role: Role;
  text: string;
}
