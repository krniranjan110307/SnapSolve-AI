import sampleBiologyImg from '../assets/images/sample_biology_diagram_1793073674507.jpg';
import samplePhysicsImg from '../assets/images/sample_physics_notes_1793073675337.jpg';
import sampleCalculusImg from '../assets/images/sample_calculus_page_1793073676123.jpg';

export interface SampleStudyMaterial {
  id: string;
  label: string;
  category: string;
  fileName: string;
  imageUrl: string;
  alt: string;
  suggestedPrompt: string;
}

/**
 * Real generated academic images for instant live testing.
 * Selecting any item loads the actual image bytes into the uploader so the user
 * triggers a genuine server-side Gemma 4 analysis—no pre-canned AI responses exist.
 */
export const SAMPLE_STUDY_MATERIALS: SampleStudyMaterial[] = [
  {
    id: 'sample-biology',
    label: 'Cellular Respiration Diagram',
    category: 'Biology Textbook',
    fileName: 'mitochondrion-cellular-respiration.jpg',
    imageUrl: sampleBiologyImg,
    alt: 'Textbook diagram of a mitochondrion showing the Krebs cycle, electron transport chain, and ATP synthase',
    suggestedPrompt: 'Walk me through how the proton gradient drives ATP synthesis in this diagram.',
  },
  {
    id: 'sample-physics',
    label: 'Projectile Motion Notes',
    category: 'Handwritten Physics',
    fileName: 'projectile-motion-notes.jpg',
    imageUrl: samplePhysicsImg,
    alt: 'Handwritten physics notebook page showing projectile motion trajectory and kinematic formulas',
    suggestedPrompt: 'Explain why vertical and horizontal motion are treated independently here.',
  },
  {
    id: 'sample-calculus',
    label: 'Tangent Line & Derivative',
    category: 'Calculus Textbook',
    fileName: 'calculus-derivative-limit.jpg',
    imageUrl: sampleCalculusImg,
    alt: 'University calculus textbook spread showing y = x^2 tangent line graph and limit definition of the derivative',
    suggestedPrompt: 'Break down each algebra step in Example 1 where h approaches 0.',
  },
];
