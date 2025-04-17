import React from "react";

function Header({ account }) {
  return (
    <header className="bg-black text-white shadow-md">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="h-12 w-12 mr-2 rounded-full"
          />
          <h1 className="text-2xl font-bold">Mini-Swap V2</h1>
        </div>
        {account && (
          <div className="bg-blue-700 px-4 py-2 rounded-lg">
            <p className="text-sm">
              Connected: {account.slice(0, 6)}...{account.slice(-4)}
            </p>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;
