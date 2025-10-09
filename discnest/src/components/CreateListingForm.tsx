'use client';
import { useState } from "react";

export default function CreateListingForm({ user, bag }: any) {
  const [form, setForm] = useState({
    title: "",
    brand: "",
    condition: "Used - Like New",
    type: "Sell",
    price: "",
    imageUrls: [],
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const location = await getApproxLocation(); // get from user
    await fetch("/api/listings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        userId: user._id,
        location,
      }),
    });
    alert("Listing created!");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input placeholder="Title" onChange={(e) => setForm({ ...form, title: e.target.value })} />
      <select value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}>
        <option value="">Brand</option>
        <option>Innova</option>
        <option>Discraft</option>
        <option>Dynamic Discs</option>
      </select>
      <button type="submit">Post Listing</button>
    </form>
  );
}

async function getApproxLocation() {
  return new Promise<{ type: string; coordinates: [number, number] }>((resolve) => {
    navigator.geolocation.getCurrentPosition((pos) => {
      resolve({
        type: "Point",
        coordinates: [pos.coords.longitude, pos.coords.latitude],
      });
    });
  });
}
