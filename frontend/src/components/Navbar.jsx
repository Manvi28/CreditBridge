import { Link } from "react-router-dom";
import "./Navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="logo">CreditBridge</Link>
        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/">Features</Link>
          <Link to="/">About</Link>
          <Link to="/">Security</Link>
          <Link to="/">Language</Link>
        </div>
        <div className="nav-buttons">
          <Link to="/login" className="btn-outline">Login</Link>
          <Link to="/register" className="btn-primary">Sign Up</Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
