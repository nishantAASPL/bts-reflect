import { createContext, useCallback, useContext, useRef, useState } from 'react';
import { streamResponse } from './api';
import { CONVERSATION_STARTERS } from './prompts';

/* ── helpers ── */
let _id = 0;
const uid = () => `msg-${++_id}-${Date.now()}`;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── context ── */
const Ctx = createContext(null);
export const useReflection = () => useContext(Ctx);

/* ── provider ── */
export function ReflectionProvider({ children }) {
  const [phase, setPhase] = useState('welcome');
  const [messages, setMessages] = useState([]);
  const [streaming, setStreaming] = useState({ active: false, text: '' });
  const [thinking, setThinking] = useState(false);
  const [typing, setTyping] = useState(false);
  const [error, setError] = useState(null);

  /* ── current conversation data ── */
  const [userName, setUserName] = useState('');
  const [role, setRole] = useState('');
  const [project, setProject] = useState('');
  const [workAreas, setWorkAreas] = useState([]);
  const [currentAnswers, setCurrentAnswers] = useState({});
  const [finalReport, setFinalReport] = useState('');

  /* ── calculate step from phase ── */
  const getStep = () => {
    const phaseMap = {
      welcome: 0,
      asking_name: 1,
      asking_role: 1,
      asking_project: 1,
      asking_daytoday: 2,
      asking_time: 2,
      asking_stakeholders: 2,
      asking_customer: 2,
      reflecting: 3,
      confirming: 3,
      asking_expansion: 4,
      generating: 5,
      complete: 5,
    };
    return phaseMap[phase] || 0;
  };

  const abortRef = useRef(null);
  const lastReflectionRef = useRef('');

  /* ── message helpers ── */
  const addAi = useCallback(
    (content) => setMessages((p) => [...p, { id: uid(), type: 'ai', content }]),
    [],
  );
  const addUser = useCallback(
    (content) => setMessages((p) => [...p, { id: uid(), type: 'user', content }]),
    [],
  );

  /* ── streaming helper ── */
  const doStream = useCallback(async (prompt) => {
    setThinking(true);
    await sleep(600);
    setThinking(false);
    setStreaming({ active: true, text: '' });

    abortRef.current = new AbortController();

    try {
      const full = await streamResponse(
        prompt,
        (token) => setStreaming((p) => ({ ...p, text: p.text + token })),
        abortRef.current.signal,
      );

      setStreaming({ active: false, text: '' });
      return full;
    } catch (err) {
      setStreaming({ active: false, text: '' });
      throw err;
    }
  }, []);

  /* ═══════════════════ flow actions ═══════════════════ */

  const start = useCallback(() => {
    setPhase('asking_name');
    addAi(CONVERSATION_STARTERS.greeting);
  }, [addAi]);

  const submitUserInput = useCallback(
    async (userMessage) => {
      addUser(userMessage);

      /* Add natural thinking/typing delay */
      setTyping(true);
      const delay = 500 + Math.random() * 1000; /* 0.5-1.5s */
      await sleep(delay);
      setTyping(false);

      try {
        if (phase === 'asking_name') {
          const name = userMessage.trim();
          setUserName(name);
          addAi(CONVERSATION_STARTERS.askRole(name));
          setPhase('asking_role');
        } else if (phase === 'asking_role') {
          setRole(userMessage);
          addAi(CONVERSATION_STARTERS.askProject);
          setPhase('asking_project');
        } else if (phase === 'asking_project') {
          setProject(userMessage);
          addAi(CONVERSATION_STARTERS.askDayToDay);
          setPhase('asking_daytoday');
        } else if (phase === 'asking_daytoday') {
          setCurrentAnswers((p) => ({ ...p, dayToDay: userMessage }));
          addAi(CONVERSATION_STARTERS.askTimeSpent);
          setPhase('asking_time');
        } else if (phase === 'asking_time') {
          setCurrentAnswers((p) => ({ ...p, timeSpent: userMessage }));
          addAi(CONVERSATION_STARTERS.askStakeholders);
          setPhase('asking_stakeholders');
        } else if (phase === 'asking_stakeholders') {
          setCurrentAnswers((p) => ({ ...p, stakeholders: userMessage }));
          addAi(CONVERSATION_STARTERS.askCustomer);
          setPhase('asking_customer');
        } else if (phase === 'asking_customer') {
          setCurrentAnswers((p) => ({ ...p, customerContact: userMessage }));
          addAi(CONVERSATION_STARTERS.beforeReflection);
          setPhase('reflecting');

          /* Stream reflection */
          await sleep(300);
          const reflectionPrompt = CONVERSATION_STARTERS.reflection(role, project, {
            ...currentAnswers,
            customerContact: userMessage,
          });

          const reflection = await doStream(reflectionPrompt);
          lastReflectionRef.current = reflection;
          addAi(reflection + '\n\n' + CONVERSATION_STARTERS.confirmReflection);
          setPhase('confirming');
        } else if (phase === 'confirming') {
          const userConfirmed = userMessage.toLowerCase().includes('yes') ||
            userMessage.toLowerCase().includes('correct') ||
            userMessage.toLowerCase().includes('accurate');

          if (!userConfirmed) {
            setCurrentAnswers((p) => ({ ...p, revision: userMessage }));
          }

          setWorkAreas((p) => [
            ...p,
            {
              label: currentAnswers.dayToDay?.slice(0, 40) || 'Work Area',
              answers: currentAnswers,
              reflection: lastReflectionRef.current || 'Captured from conversation',
            },
          ]);

          addAi(CONVERSATION_STARTERS.askExpansion);
          setPhase('asking_expansion');
        } else if (phase === 'asking_expansion') {
          const hasMore = userMessage.toLowerCase().includes('yes');

          if (hasMore) {
            setCurrentAnswers({});
            lastReflectionRef.current = '';
            addAi(CONVERSATION_STARTERS.askDayToDay);
            setPhase('asking_daytoday');
          } else {
            addAi(CONVERSATION_STARTERS.beforeFinalReport);
            setPhase('generating');

            /* Generate final report */
            await sleep(300);
            const reportPrompt = CONVERSATION_STARTERS.finalReport(userName, role, project, workAreas);
            const report = await doStream(reportPrompt);
            setFinalReport(report);
            addAi(`Your work reflection report is ready${userName ? `, ${userName.split(' ')[0]}` : ''}. You can read, copy, or download it in the panel on the right.`);
            setPhase('complete');
          }
        }
      } catch (err) {
        if (err.name === 'AbortError') return;
        setError(err.message);
      }
    },
    [phase, userName, role, project, currentAnswers, workAreas, addUser, addAi, doStream],
  );

  const restart = useCallback(() => {
    abortRef.current?.abort();
    setPhase('welcome');
    setMessages([]);
    setStreaming({ active: false, text: '' });
    setThinking(false);
    setUserName('');
    setRole('');
    setProject('');
    setWorkAreas([]);
    setCurrentAnswers({});
    setFinalReport('');
    setError(null);
    lastReflectionRef.current = '';
    _id = 0;
  }, []);

  const dismissError = useCallback(() => setError(null), []);

  return (
    <Ctx.Provider
      value={{
        /* state */
        phase,
        step: getStep(),
        messages,
        streaming,
        thinking,
        typing,
        error,
        finalReport,
        userName,
        role,
        project,
        workAreas,
        /* actions */
        start,
        submitUserInput,
        restart,
        dismissError,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
