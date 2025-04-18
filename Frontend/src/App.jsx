import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import 'daisyui';

function App() {
  const [goal, setGoal] = useState('');
  const [level, setLevel] = useState('Beginner');
  const [roadmap, setRoadmap] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState({});

  const inputRef = useRef(null);

  useEffect(() => {
    const savedProgress = localStorage.getItem('eduaid_progress');
    if (savedProgress) setProgress(JSON.parse(savedProgress));

    const savedRoadmap = localStorage.getItem('eduaid_roadmap');
    if (savedRoadmap) setRoadmap(savedRoadmap);

    const savedGoal = localStorage.getItem('eduaid_goal');
    if (savedGoal) setGoal(savedGoal);

    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (goal) localStorage.setItem('eduaid_goal', goal);
  }, [goal]);

  useEffect(() => {
    if (Object.keys(progress).length > 0) {
      localStorage.setItem('eduaid_progress', JSON.stringify(progress));
    }
  }, [progress]);

  useEffect(() => {
    if (roadmap) localStorage.setItem('eduaid_roadmap', roadmap);
  }, [roadmap]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!goal.trim()) return;

    setLoading(true);
    setError('');
    setRoadmap('');
    try {
      const res = await axios.post('http://localhost:5000/generate', { goal, level });
      setRoadmap(res.data.roadmap);
    } catch (err) {
      setError("Error generating roadmap! Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  const cleanRoadmap = (text) => {
    const labels = [
      "Assumptions", "Roadmap Structure", "Goal", "Topics", "Exercises",
      "Online", "Resources", "Books", "Important Notes",
      "Contribute to Open Source Projects", "Activities", "Milestone"
    ];
    const regex = new RegExp(`(${labels.join('|')}):([\\s\\S]+?)(?=${labels.join('|')}|$)`, 'g');
    let matches = [...text.matchAll(regex)];
    let roadmapSections = {};

    matches.forEach(match => {
      const label = match[1].trim();
      let content = match[2].trim().replace(/(\*\*|__)/g, '').trim();
      if (!roadmapSections[label]) roadmapSections[label] = [];
      roadmapSections[label].push(content);
    });

    return Object.keys(roadmapSections).map(label => ({
      label,
      content: roadmapSections[label].join('\n\n')
    }));
  };

  const toggleTask = (sectionLabel, lineIndex) => {
    setProgress(prev => {
      const newProgress = { ...prev };
      const key = `${sectionLabel}-${lineIndex}`;
      newProgress[key] = !newProgress[key];
      return newProgress;
    });
  };

  const formatContentWithCheckboxes = (sectionLabel, content) => {
    return content.split('\n').map((line, index) => {
      if (line.trim() === '') return null;

      return (
        <label key={index} className="flex items-start gap-3 mb-2">
          <input
            type="checkbox"
            className="checkbox checkbox-primary"
            checked={progress[`${sectionLabel}-${index}`] || false}
            onChange={() => toggleTask(sectionLabel, index)}
          />
          <span className={progress[`${sectionLabel}-${index}`] ? "line-through opacity-60" : ""}>
            {line}
          </span>
        </label>
      );
    });
  };

  const clearAll = () => {
    setGoal('');
    setRoadmap('');
    setProgress({});
    localStorage.removeItem('eduaid_goal');
    localStorage.removeItem('eduaid_roadmap');
    localStorage.removeItem('eduaid_progress');
    inputRef.current?.focus();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 to-base-300 flex flex-col items-center justify-start p-8">
      <div className="w-full max-w-7xl bg-base-100 shadow-2xl p-10 rounded-3xl">
        <h1 className="text-4xl font-bold mb-8 text-center text-primary">
          EduAid — AI Study Roadmap Generator
        </h1>

        <form
          onSubmit={handleSubmit}
          className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-8 w-full"
        >
          <div className="flex flex-col gap-3 w-full md:flex-1">
            <input
              ref={inputRef}
              type="text"
              value={goal}
              onChange={e => setGoal(e.target.value)}
              placeholder="Enter your learning goal (e.g. Learn Python for Data Science)"
              required
              className="input input-bordered input-lg w-full"
            />
          </div>

          <select
            value={level}
            onChange={e => setLevel(e.target.value)}
            className="select select-bordered select-lg w-full md:w-1/3"
          >
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full md:w-auto"
            disabled={loading}
          >
            {loading ? 'Generating...' : 'Generate'}
          </button>
        </form>

        {goal && (
          <button
            onClick={clearAll}
            className="btn btn-warning mb-6"
          >
            Clear Goal
          </button>
        )}

        {error && (
          <div className="alert alert-error shadow-lg my-6 text-lg font-semibold">
            {error}
          </div>
        )}

        {roadmap && (
          <div className="flex flex-col gap-8 items-center justify-center mt-6">
            {(() => {
              const sections = cleanRoadmap(roadmap);
              const milestones = sections.filter(s => s.label === "Milestone");
              const others = sections.filter(s => s.label !== "Milestone");

              return (
                <>
                  {others.map((section, index) => (
                    <div
                      key={`other-${index}`}
                      className="card bg-base-300 text-base-content shadow-xl p-8 rounded-3xl w-full max-w-5xl hover:shadow-2xl hover:scale-[1.02] transition duration-300"
                    >
                      <h4 className="text-xl font-bold text-secondary mb-4">
                        {section.label}
                      </h4>
                      <div className="text-base leading-relaxed break-words whitespace-pre-wrap max-h-[300px] overflow-auto">
                        {section.label === 'Goal' ? (
                          <div>{section.content}</div>
                        ) : (
                          formatContentWithCheckboxes(section.label, section.content)
                        )}
                      </div>
                    </div>
                  ))}

                  {milestones.map((section, index) => (
                    <div
                      key={`milestone-${index}`}
                      className="card bg-yellow-300 font-semibold text-black shadow-xl p-8 rounded-3xl w-full max-w-5xl hover:shadow-2xl hover:scale-[1.02] transition duration-300"
                    >
                      <h4 className="text-xl font-bold text-black mb-4">
                        {section.label}
                      </h4>
                      <div className="text-base leading-relaxed break-words whitespace-pre-wrap max-h-[300px] overflow-auto text-black">
                        {formatContentWithCheckboxes(section.label, section.content)}
                      </div>
                    </div>
                  ))}
                </>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
