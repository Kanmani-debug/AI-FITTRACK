import { useState } from "react";
import { aiApi } from "../api/endpoints";
import Layout from "../components/Layout";
import Banner from "../components/Banner";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";

export default function Insights() {
  const [result, setResult] = useState(null);
  const [statsUsed, setStatsUsed] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setError("");
    setIsLoading(true);
    setResult(null);
    try {
      // Sends no manual stats - the backend automatically calculates them
      // from this user's real, logged workout data in MongoDB.
      const res = await aiApi.insights({});
      setResult(res.data.data.insights);
      setStatsUsed(res.data.data.statsUsed);
    } catch (err) {
      setError((err.errors && err.errors.join(" ")) || err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <div className="page-header">
        <div>
          <h1>AI fitness insights</h1>
          <p className="page-header__subtitle">
            Gemini analyzes your actual logged workouts to generate feedback.
          </p>
        </div>
        <button className="btn btn--primary" onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? "Analyzing…" : "Generate insights"}
        </button>
      </div>

      {error && <Banner type="error" onClose={() => setError("")}>{error}</Banner>}

      {isLoading && <Loader label="Gemini is analyzing your training data…" />}

      {!isLoading && !result && !error && (
        <EmptyState
          title="No insights generated yet"
          description="Click 'Generate insights' to have Gemini analyze your workout history and give you personalized feedback."
        />
      )}

      {result && (
        <>
          {statsUsed && (
            <div className="stats-grid">
              <div className="stat-card">
                <span className="stat-card__label">Total workouts</span>
                <span className="stat-card__value numeral">{statsUsed.totalWorkouts}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label">Average duration</span>
                <span className="stat-card__value numeral">{statsUsed.averageDuration}<span className="stat-card__unit">min</span></span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label">Calories burned</span>
                <span className="stat-card__value numeral">{statsUsed.caloriesBurned}<span className="stat-card__unit">kcal</span></span>
              </div>
            </div>
          )}

          <div className="card">
            <div className="ai-block">
              <h3>Performance analysis</h3>
              <p>{result.performanceAnalysis}</p>
            </div>

            {Array.isArray(result.improvementSuggestions) && result.improvementSuggestions.length > 0 && (
              <div className="ai-block">
                <h3>Improvement suggestions</h3>
                <ul>{result.improvementSuggestions.map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            )}

            {result.progressSummary && (
              <div className="ai-block">
                <h3>Progress summary</h3>
                <p>{result.progressSummary}</p>
              </div>
            )}

            {result.motivationalAdvice && (
              <div className="ai-block">
                <h3>Motivational advice</h3>
                <p>{result.motivationalAdvice}</p>
              </div>
            )}

            {result.disclaimer && <p className="disclaimer">{result.disclaimer}</p>}
          </div>
        </>
      )}
    </Layout>
  );
}
