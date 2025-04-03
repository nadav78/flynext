'use client';
import React, { useState, useEffect } from "react"; 
<<<<<<< HEAD
import Navbar from "../components/Navbar";
=======
import Navbar from "../../components/navbar";
>>>>>>> 09ab347c783da35ad0f32490b2fdc9fc243b0827

export default function Flights() {
    return (
        <div className="flex flex-col min-h-screen min-w-screen bg-base-200">
            <Navbar/>
            <div className="flex flex-col min-h-screen items-center justify-center w-full px-4">
                <h1 className="text-4xl font-bold text-center">Hotels</h1>
                <p className="text-lg text-center">Search and book for hotels.</p>
            </div>
        </div>
    );
}