import type { WorldViewProps } from '../types';
import { AboutWorld } from './AboutWorld';
import { EngineeringWorld } from './EngineeringWorld';
import { LabWorld } from './LabWorld';
import { ProjectsWorld } from './ProjectsWorld';
import { CreativeWorld } from './CreativeWorld';
import { WritingWorld } from './WritingWorld';
import { ContactWorld } from './ContactWorld';
import { WorldDocument } from './WorldDocument';
import './worlds.css';
import './world-motion.css';

export function WorldView(props: WorldViewProps) {
  return (
    <WorldDocument active={props.active !== false}>
      <WorldContent {...props} />
    </WorldDocument>
  );
}

function WorldContent(props: WorldViewProps) {
  switch (props.navigation.world) {
    case 'about':
      return <AboutWorld {...props} />;
    case 'engineering':
      return <EngineeringWorld {...props} />;
    case 'ai-lab':
      return <LabWorld {...props} />;
    case 'projects':
      return <ProjectsWorld {...props} />;
    case 'creative':
      return <CreativeWorld {...props} />;
    case 'writing':
      return <WritingWorld {...props} />;
    case 'contact':
      return <ContactWorld />;
    default:
      return null;
  }
}
