export default function DiscCard({ disc }: { disc: any }) {
  return (
    <div className="border p-4 rounded shadow-sm bg-white">
      <h2 className="font-semibold text-lg">{disc.name}</h2>
      <p className="text-sm text-gray-600">{disc.brand} • {disc.type}</p>
      <p className="text-sm mt-2">Wear Level: {disc.wearLevel}%</p>
      {disc.notes && <p className="text-xs mt-1 italic">{disc.notes}</p>}
    </div>
  );
}