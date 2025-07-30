import "./globals.css";

export const metadata = {
  title: "SportsFeud Quiz",
  description: "Participate in interactive sports quizzes and compete on the leaderboard!",
  icons: {
    icon: "/quiz.svg"
  }
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
