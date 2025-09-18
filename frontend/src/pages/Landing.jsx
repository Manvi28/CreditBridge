import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import "./Landing.css";
import { Link } from "react-router-dom";

const Landing = () => {
  return (
    <div>
      <Navbar />

      <section className="hero">
        <div className="hero-content">
          <h1>Build Your Credit Future</h1>
          <p>AI-powered credit scoring for first-time borrowers. Establish trust. Unlock opportunities.</p>
          <Link to="/register" className="hero-btn">Get Started</Link>
        </div>
      </section>

      <section className="features">
        <h2>Why CreditBridge?</h2>
        <div className="card-grid">
          <div className="card">
            <h3>AI-Powered Scoring</h3>
            <p>We analyze income, payments & education to generate a personalized credit score from 0–100.</p>
          </div>
          <div className="card">
            <h3>No Past Credit History Needed</h3>
            <p>Even first-time borrowers can prove their reliability through alternative data.</p>
          </div>
          <div className="card">
            <h3>Secure & Transparent</h3>
            <p>Your data is encrypted and only you control who sees your credit profile.</p>
          </div>
        </div>
      </section>

      <section className="how">
        <h2>How It Works</h2>
        <div className="card-grid">
          <div className="card step">
            <span className="step-number">1</span>
            <h3>Complete Your Profile</h3>
            <p>Fill in your income, payment history, and education details.</p>
          </div>
          <div className="card step">
            <span className="step-number">2</span>
            <h3>Get Your Score</h3>
            <p>Our AI model instantly generates your credit score and risk band.</p>
          </div>
          <div className="card step">
            <span className="step-number">3</span>
            <h3>Share & Unlock Loans</h3>
            <p>Use your score to build trust with lenders and unlock opportunities.</p>
          </div>
        </div>
      </section>

      <section className="cta">
        <h2>Ready to Build Your Credit Journey?</h2>
        <Link to="/register" className="cta-btn">Join Now</Link>
      </section>

      <Footer />
    </div>
  );
};

export default Landing;
