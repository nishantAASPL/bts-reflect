import { ReflectionProvider, useReflection } from './store';
import Landing from './components/Landing';
import Header from './components/Header';
import ChatView from './components/ChatView';
import FinalReport from './components/FinalReport';

function AppContent() {
  const { phase } = useReflection();

  if (phase === 'welcome') {
    return <Landing />;
  }

  const isComplete = phase === 'complete';

  return (
    <div className={`app${isComplete ? ' app-split' : ''}`}>
      <Header />
      {isComplete ? (
        <div className="split-body">
          <div className="chat-pane">
            <ChatView />
          </div>
          <div className="artifact-pane">
            <FinalReport />
          </div>
        </div>
      ) : (
        <ChatView />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ReflectionProvider>
      <AppContent />
    </ReflectionProvider>
  );
}
