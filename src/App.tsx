import { useState } from 'react';
import { ThemeProvider } from '@/components/ui/ThemeProvider';
import { LandingPage } from '@/pages/LandingPage';
import { GeneratorWorkspace } from '@/pages/GeneratorWorkspace';
import { RelationalExplorer } from '@/pages/RelationalExplorer';
import { DocumentGenerator } from '@/pages/DocumentGenerator';

type Route = 'landing' | 'workspace' | 'relational' | 'documents';

function App() {
  const [route, setRoute] = useState<Route>('landing');

  return (
    <ThemeProvider>
      {route === 'landing' && <LandingPage onStart={() => setRoute('workspace')} />}
      {route === 'workspace' && (
        <GeneratorWorkspace
          onNavigateDocuments={() => setRoute('documents')}
        />
      )}
      {route === 'relational' && <RelationalExplorer onBack={() => setRoute('workspace')} />}
      {route === 'documents' && <DocumentGenerator onBack={() => setRoute('workspace')} />}
    </ThemeProvider>
  );
}

export default App;
