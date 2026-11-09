import { Component } from 'react';

export default class ErrorBoundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() { return { failed: true }; }
  render() {
    if (this.state.failed) return <main className="p-8"><h1 className="text-2xl font-bold">Unable to display this page</h1><p className="my-4">Reload the application to try again. Your saved changes will remain available.</p><button className="tb-btn-primary" onClick={() => window.location.reload()}>Reload</button></main>;
    return this.props.children;
  }
}
