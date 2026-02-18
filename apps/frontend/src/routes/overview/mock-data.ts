export type PullRequestStatus = "REVIEW NEEDED" | "CHANGES REQUESTED" | "APPROVED" | "MERGED";

export type PullRequestItem = {
  id: string;
  title: string;
  author: string;
  ago: string;
  branch: string;
  comments: number;
  status: PullRequestStatus;
};

export type CiStatusState = "Passed" | "Failed" | "In Progress";

export type CiStatusItem = {
  id: string;
  name: string;
  branch: string;
  duration: string;
  state: CiStatusState;
};

export type ActivityItem = {
  id: string;
  text: string;
  ago: string;
};

export const pullRequestsMock: PullRequestItem[] = [
  {
    id: "pr-1",
    title: "Fix login bug",
    author: "Sarah M.",
    ago: "5m ago",
    branch: "bugfix/login-timeout",
    comments: 6,
    status: "REVIEW NEEDED"
  },
  {
    id: "pr-2",
    title: "UI Updates",
    author: "Mark T.",
    ago: "33m ago",
    branch: "feature/ui-overhaul",
    comments: 11,
    status: "CHANGES REQUESTED"
  },
  {
    id: "pr-3",
    title: "Refactor API Endpoints",
    author: "Alex G.",
    ago: "25m ago",
    branch: "refactor/api-endpoints",
    comments: 3,
    status: "APPROVED"
  },
  {
    id: "pr-4",
    title: "Add Kubernetes Support",
    author: "David W.",
    ago: "2h ago",
    branch: "feature/k8s-support",
    comments: 1,
    status: "MERGED"
  }
];

export const ciStatusesMock: CiStatusItem[] = [
  {
    id: "ci-1",
    name: "Frontend Build",
    branch: "main",
    duration: "3m 11s",
    state: "Passed"
  },
  {
    id: "ci-2",
    name: "API Tests",
    branch: "feature/ui-overhaul",
    duration: "5m 02s",
    state: "Failed"
  },
  {
    id: "ci-3",
    name: "Deploy to Staging",
    branch: "main",
    duration: "In queue",
    state: "In Progress"
  },
  {
    id: "ci-4",
    name: "Lint & Test Suite",
    branch: "main",
    duration: "2m 47s",
    state: "Passed"
  }
];

export const activityMock: ActivityItem[] = [
  { id: "activity-1", text: "James commented on Refactor API Endpoints", ago: "5m ago" },
  { id: "activity-2", text: "Olivia pushed to feature/ui-overhaul", ago: "15m ago" },
  { id: "activity-3", text: "Chris merged Add Kubernetes Support", ago: "38m ago" },
  { id: "activity-4", text: "Lisa started a discussion on Database Migration Plan", ago: "1h ago" },
  { id: "activity-5", text: "Noah reviewed UI Updates", ago: "1h ago" }
];

export const chatMessagesMock = [
  "Emma: Please review the latest PR when you can.",
  "DevBot: Frontend build has passed!",
  "Tom: Anyone free for a quick call?",
  "Sarah: Pushed a fix for auth callback handling."
];

export const snippetMock = `const fetchData = async () => {
  try {
    const response = await api.get('/data');
    return response.data;
  } catch (error) {
    console.error('Fetch error', error);
  }
};`;
