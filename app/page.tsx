'use client';

export default function Home() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold mb-8">Circle Research</h1>
      <p className="text-lg mb-4">Welcome to Circle Research application built with Next.js and VO.</p>
      <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-lg">
        <h2 className="text-2xl font-semibold mb-4">Getting Started</h2>
        <p className="text-gray-700 dark:text-gray-300">
          This is a Next.js application with TypeScript and Tailwind CSS.
        </p>
      </div>
    </main>
  );
}