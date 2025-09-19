import React from 'react';

function TestApp() {
  console.log('TestApp is rendering!');
  
  return (
    <div className="min-h-screen bg-blue-500 flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Test App is Working!
        </h1>
        <p className="text-gray-600">
          If you can see this, React is rendering properly.
        </p>
        <div className="mt-4 p-4 bg-green-100 rounded">
          <p className="text-green-800">
            ✅ React is working<br/>
            ✅ Tailwind CSS is working<br/>
            ✅ Components are rendering
          </p>
        </div>
      </div>
    </div>
  );
}

export default TestApp;