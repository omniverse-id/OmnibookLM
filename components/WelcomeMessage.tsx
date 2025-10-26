import React from 'react';

const WelcomeMessage: React.FC = () => {
    return (
        <div className="max-w-5xl w-full text-center flex flex-col items-center">
            <h1 className="text-4xl font-normal text-gray-800 mb-3">Hi, Guest</h1>
            <p className="text-xl text-gray-500">Let's Learn Together</p>
        </div>
    );
};

export default WelcomeMessage;