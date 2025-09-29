// src/app/contact/page.tsx
export default function ContactPage() {
  return (
    <div className="max-w-xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold text-green-700">Contact Us</h1>
      <p className="text-gray-600">Have questions or feedback? We'd love to hear from you.</p>
      <form className="space-y-4">
        <input
          type="email"
          placeholder="Your email"
          className="w-full border px-4 py-2 rounded"
        />
        <textarea
          placeholder="Your message"
          className="w-full border px-4 py-2 rounded h-32"
        />
        <button
          type="submit"
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          Send Message
        </button>
      </form>
    </div>
  );
}