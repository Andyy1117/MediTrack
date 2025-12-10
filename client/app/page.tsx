import Link from "next/link";
import { UserPlus, FileText, Calculator } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] py-2">
      <main className="flex flex-col items-center justify-center w-full flex-1 px-20 text-center">
        <h1 className="text-6xl font-bold text-indigo-600 mb-8">
          MediTrack
        </h1>
        <p className="mt-3 text-2xl text-gray-600 mb-12">
          Өвчтөн бүртгэл & Урамшуулал тооцох систем
        </p>

        <div className="flex flex-wrap justify-center gap-6 max-w-4xl">
          <Link href="/add-patient" className="group block w-full sm:w-64 p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-50 transition-colors">
            <div className="flex flex-col items-center">
              <UserPlus className="h-12 w-12 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">Өвчтөн нэмэх</h5>
              <p className="font-normal text-gray-700">Шинэ өвчтөний мэдээллийг бүртгэх.</p>
            </div>
          </Link>

          <Link href="/view-records" className="group block w-full sm:w-64 p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-50 transition-colors">
            <div className="flex flex-col items-center">
              <FileText className="h-12 w-12 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">Жагсаалт харах</h5>
              <p className="font-normal text-gray-700">Бүртгэлтэй өвчтөнүүдийн түүхийг шүүж харах.</p>
            </div>
          </Link>

          <Link href="/bonus-calculator" className="group block w-full sm:w-64 p-6 bg-white border border-gray-200 rounded-lg shadow-md hover:bg-gray-50 transition-colors">
            <div className="flex flex-col items-center">
              <Calculator className="h-12 w-12 text-indigo-500 mb-4 group-hover:scale-110 transition-transform" />
              <h5 className="mb-2 text-2xl font-bold tracking-tight text-gray-900">Урамшуулал</h5>
              <p className="font-normal text-gray-700">Эмч нарын 7 хоногийн урамшууллыг тооцох.</p>
            </div>
          </Link>
        </div>
      </main>
    </div>
  );
}
