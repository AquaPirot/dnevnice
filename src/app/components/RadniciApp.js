'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, User, Plus, Trash2, Calculator, Edit2, Printer } from 'lucide-react';

const RadniciDnevniceApp = () => {
  const [radnici, setRadnici] = useState([]);
  const [noviRadnik, setNoviRadnik] = useState('');
  const [selectedRadnik, setSelectedRadnik] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [dnevnicaVrednost, setDnevnicaVrednost] = useState(2500);
  const [editingDnevnica, setEditingDnevnica] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Postavi da je komponenta mount-ovana (hydration fix)
  useEffect(() => {
    setMounted(true);
  }, []);

  // Učitaj podatke iz localStorage-a tek kada je komponenta mount-ovana
  useEffect(() => {
    if (mounted) {
      try {
        const savedRadnici = localStorage.getItem('radnici');
        const savedDnevnica = localStorage.getItem('dnevnicaVrednost');
        
        if (savedRadnici) {
          setRadnici(JSON.parse(savedRadnici));
        }
        if (savedDnevnica) {
          setDnevnicaVrednost(JSON.parse(savedDnevnica));
        }
      } catch (error) {
        console.log('Error loading from localStorage:', error);
      }
    }
  }, [mounted]);

  // Sačuvaj radnike u localStorage kad se promene
  useEffect(() => {
    if (mounted && radnici.length >= 0) {
      try {
        localStorage.setItem('radnici', JSON.stringify(radnici));
      } catch (error) {
        console.log('Error saving radnici to localStorage:', error);
      }
    }
  }, [radnici, mounted]);

  // Sačuvaj vrednost dnevnice u localStorage kad se promeni
  useEffect(() => {
    if (mounted) {
      try {
        localStorage.setItem('dnevnicaVrednost', JSON.stringify(dnevnicaVrednost));
      } catch (error) {
        console.log('Error saving dnevnica to localStorage:', error);
      }
    }
  }, [dnevnicaVrednost, mounted]);

  // Kreiranje kalendara za trenutni mesec
  const getDaysInMonth = (month, year) => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDay = firstDay.getDay(); // 0 = nedelja, 1 = ponedeljak...
    
    const days = [];
    
    // Dodaj prazne ćelije za početak meseca
    for (let i = 0; i < startDay; i++) {
      days.push(null);
    }
    
    // Dodaj dane meseca
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    
    return days;
  };

  const dodajRadnika = () => {
    if (noviRadnik.trim()) {
      const noviId = Date.now();
      setRadnici([...radnici, {
        id: noviId,
        ime: noviRadnik.trim(),
        radniDani: {}
      }]);
      setNoviRadnik('');
    }
  };

  const ukloniRadnika = (id) => {
    setRadnici(radnici.filter(r => r.id !== id));
    if (selectedRadnik && selectedRadnik.id === id) {
      setSelectedRadnik(null);
    }
  };

  const toggleRadniDan = (dan) => {
    if (!selectedRadnik) return;
    
    const monthKey = `${currentYear}-${currentMonth}`;
    const updatedRadnici = radnici.map(radnik => {
      if (radnik.id === selectedRadnik.id) {
        const newRadniDani = { ...radnik.radniDani };
        if (!newRadniDani[monthKey]) {
          newRadniDani[monthKey] = {};
        }
        
        // Logika za rotaciju: 0 -> 0.5 -> 1 -> 0
        const trenutnaVrednost = newRadniDani[monthKey][dan] || 0;
        if (trenutnaVrednost === 0) {
          newRadniDani[monthKey][dan] = 0.5; // Pola smene
        } else if (trenutnaVrednost === 0.5) {
          newRadniDani[monthKey][dan] = 1; // Cela smena
        } else {
          newRadniDani[monthKey][dan] = 0; // Nema rada
        }
        
        return { ...radnik, radniDani: newRadniDani };
      }
      return radnik;
    });
    
    setRadnici(updatedRadnici);
    setSelectedRadnik(updatedRadnici.find(r => r.id === selectedRadnik.id));
  };

  const getBrojRadnihDana = (radnik) => {
    const monthKey = `${currentYear}-${currentMonth}`;
    if (!radnik.radniDani[monthKey]) return 0;
    return Object.values(radnik.radniDani[monthKey]).reduce((sum, vrednost) => sum + (vrednost || 0), 0);
  };

  const getUkupnaZarada = (radnik) => {
    return getBrojRadnihDana(radnik) * dnevnicaVrednost;
  };

  const getDanStatus = (dan) => {
    if (!selectedRadnik) return 0;
    const monthKey = `${currentYear}-${currentMonth}`;
    return selectedRadnik.radniDani[monthKey] && selectedRadnik.radniDani[monthKey][dan] || 0;
  };

  const getDanClass = (dan, status) => {
    const baseClass = `h-10 sm:h-12 border border-gray-200 flex items-center justify-center cursor-pointer text-xs sm:text-sm transition-colors relative`;
    
    if (!dan) return `${baseClass} bg-gray-50`;
    
    if (status === 0) {
      return `${baseClass} hover:bg-gray-100 active:bg-gray-200`;
    } else if (status === 0.5) {
      return `${baseClass} bg-yellow-400 text-white font-semibold hover:bg-yellow-500`;
    } else if (status === 1) {
      return `${baseClass} bg-green-500 text-white font-semibold hover:bg-green-600`;
    }
    
    return baseClass;
  };

  const meseci = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
    'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ];

  const daniUNedelji = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];

  const generateReport = () => {
    const monthKey = `${currentYear}-${currentMonth}`;
    const reportData = radnici.map(radnik => ({
      ime: radnik.ime,
      radniSati: getBrojRadnihDana(radnik),
      zarada: getUkupnaZarada(radnik)
    }));

    const ukupniSati = reportData.reduce((sum, radnik) => sum + radnik.radniSati, 0);
    const ukupnaZarada = reportData.reduce((sum, radnik) => sum + radnik.zarada, 0);

    return {
      mesec: meseci[currentMonth],
      godina: currentYear,
      radnici: reportData,
      ukupniSati,
      ukupnaZarada,
      dnevnicaVrednost
    };
  };

  const printReport = () => {
    setShowReport(true);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  // Ne prikazuj ništa dok se komponenta ne mount-uje (hydration fix)
  if (!mounted) {
    return null;
  }

  return (
    <>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          body { margin: 0; padding: 20px; }
          .print-report { 
            display: block !important; 
            max-width: none !important;
            box-shadow: none !important;
            border: none !important;
          }
        }
        .print-only { display: none; }
      `}</style>
      
      <div className="min-h-screen bg-gray-50 p-2 sm:p-4 no-print">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-8 flex items-center gap-2">
            <User className="text-blue-600" size={24} />
            <span className="leading-tight">Evidencija radnih sati</span>
          </h1>

          {/* Sekcija za dodavanje radnika */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
              <Plus className="text-green-600" size={20} />
              Dodaj radnika
            </h2>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                value={noviRadnik}
                onChange={(e) => setNoviRadnik(e.target.value)}
                placeholder="Ime i prezime radnika"
                className="flex-1 px-3 sm:px-4 py-2 text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                onKeyPress={(e) => e.key === 'Enter' && dodajRadnika()}
              />
              <button
                onClick={dodajRadnika}
                className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-base"
              >
                <Plus size={20} />
                <span className="hidden sm:inline">Dodaj</span>
              </button>
            </div>
          </div>

          {/* Lista radnika */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4">Lista radnika</h2>
            {radnici.length === 0 ? (
              <p className="text-gray-500 text-center py-6 sm:py-8">Nema unetih radnika</p>
            ) : (
              <div className="space-y-2">
                {radnici.map(radnik => (
                  <div
                    key={radnik.id}
                    className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedRadnik && selectedRadnik.id === radnik.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                    onClick={() => setSelectedRadnik(radnik)}
                  >
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <User className="text-gray-600" size={20} />
                      <span className="font-medium text-base">{radnik.ime}</span>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                      <div className="text-sm text-gray-600 flex justify-between sm:block">
                        <span>Radni sati: <span className="font-semibold">{getBrojRadnihDana(radnik)}</span></span>
                        <span className="text-green-600 font-semibold sm:hidden">
                          {getUkupnaZarada(radnik).toLocaleString()} RSD
                        </span>
                      </div>
                      <div className="hidden sm:block text-sm text-green-600 font-semibold">
                        {getUkupnaZarada(radnik).toLocaleString()} RSD
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          ukloniRadnika(radnik.id);
                        }}
                        className="text-red-500 hover:text-red-700 transition-colors self-end sm:self-auto"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Kontrole za dnevnicu i izveštaj */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                  <Calculator className="text-green-600" size={20} />
                  Vrednost po smeni
                </h2>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                  <span className="text-gray-700 text-base">Po smeni:</span>
                  {editingDnevnica ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={dnevnicaVrednost}
                        onChange={(e) => setDnevnicaVrednost(Number(e.target.value))}
                        className="px-3 py-1 border border-gray-300 rounded w-24 sm:w-32 focus:ring-2 focus:ring-blue-500 text-base"
                      />
                      <span className="text-gray-600">RSD</span>
                      <button
                        onClick={() => setEditingDnevnica(false)}
                        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                      >
                        Sačuvaj
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-lg text-green-600">
                        {dnevnicaVrednost.toLocaleString()} RSD
                      </span>
                      <button
                        onClick={() => setEditingDnevnica(true)}
                        className="text-blue-600 hover:text-blue-800 p-1"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Dugme za izveštaj */}
              <div className="flex flex-col sm:flex-row gap-2">
                <button
                  onClick={printReport}
                  disabled={radnici.length === 0}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm"
                >
                  <Printer size={18} />
                  Štampaj izveštaj
                </button>
              </div>
            </div>
          </div>

          {/* Kalendar */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-4">
              <h2 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
                <Calendar className="text-blue-600" size={20} />
                Kalendar radnih sati
              </h2>
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4">
                <select
                  value={currentMonth}
                  onChange={(e) => setCurrentMonth(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                >
                  {meseci.map((mesec, index) => (
                    <option key={index} value={index}>{mesec}</option>
                  ))}
                </select>
                <select
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-base"
                >
                  {[2023, 2024, 2025, 2026].map(godina => (
                    <option key={godina} value={godina}>{godina}</option>
                  ))}
                </select>
              </div>
            </div>

            {selectedRadnik ? (
              <div>
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-blue-800 font-medium text-sm sm:text-base">
                    Uređujete kalendar za: {selectedRadnik.ime}
                  </p>
                  <p className="text-xs sm:text-sm text-blue-600 mt-1">
                    Kliknite na dane: <span className="font-semibold">1x = Pola smene</span>, <span className="font-semibold">2x = Cela smena</span>, <span className="font-semibold">3x = Obriši</span>
                  </p>
                </div>

                {/* Legenda */}
                <div className="mb-4 flex flex-wrap gap-4 text-xs sm:text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-gray-200 border border-gray-300"></div>
                    <span>Nema rada</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-yellow-400"></div>
                    <span>Pola smene</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-green-500"></div>
                    <span>Cela smena</span>
                  </div>
                </div>

                {/* Zaglavlje kalendara */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {daniUNedelji.map(dan => (
                    <div key={dan} className="p-1 sm:p-2 text-center font-semibold text-gray-600 text-xs sm:text-sm">
                      {dan}
                    </div>
                  ))}
                </div>

                {/* Dani u kalendaru */}
                <div className="grid grid-cols-7 gap-1">
                  {getDaysInMonth(currentMonth, currentYear).map((dan, index) => {
                    const status = getDanStatus(dan);
                    return (
                      <div
                        key={index}
                        className={getDanClass(dan, status)}
                        onClick={() => dan && toggleRadniDan(dan)}
                      >
                        <span>{dan}</span>
                        {dan && status === 0.5 && (
                          <div className="absolute top-0 right-0 w-2 h-2 bg-yellow-600 rounded-full text-xs"></div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Sumarni prikaz */}
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 text-center">
                    <div className="flex justify-between sm:block">
                      <span className="text-sm text-gray-600 sm:hidden">Radni sati:</span>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-blue-600">
                          {getBrojRadnihDana(selectedRadnik)}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">Radni sati</div>
                      </div>
                    </div>
                    <div className="flex justify-between sm:block">
                      <span className="text-sm text-gray-600 sm:hidden">Po smeni:</span>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-green-600">
                          {dnevnicaVrednost.toLocaleString()}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">RSD po smeni</div>
                      </div>
                    </div>
                    <div className="flex justify-between sm:block">
                      <span className="text-sm text-gray-600 sm:hidden">Ukupno:</span>
                      <div>
                        <div className="text-xl sm:text-2xl font-bold text-purple-600">
                          {getUkupnaZarada(selectedRadnik).toLocaleString()}
                        </div>
                        <div className="text-xs sm:text-sm text-gray-600 hidden sm:block">Ukupna zarada</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-8 sm:py-12 text-gray-500">
                <Calendar size={36} className="sm:w-12 sm:h-12 mx-auto mb-3 sm:mb-4 text-gray-300" />
                <p className="text-sm sm:text-base">Izaberite radnika da biste uredili kalendar</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="text-center mt-8 py-4 text-gray-500 text-sm">
            by AG Group
          </div>
        </div>
      </div>

      {/* Izveštaj za štampanje */}
      {showReport && (
        <div className="print-only print-report fixed inset-0 bg-white z-50 p-8" style={{display: showReport ? 'block' : 'none'}}>
          <div className="max-w-4xl mx-auto">
            {(() => {
              const report = generateReport();
              return (
                <>
                  {/* Header izveštaja */}
                  <div className="text-center mb-8 border-b-2 border-gray-300 pb-6">
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                      MESEČNI IZVEŠTAJ RADNIH SATI
                    </h1>
                    <div className="text-xl text-gray-600 mb-2">
                      {report.mesec} {report.godina}
                    </div>
                    <div className="text-sm text-gray-500">
                      by AG Group
                    </div>
                  </div>

                  {/* Osnovne informacije */}
                  <div className="mb-8 bg-gray-50 p-4 rounded">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Datum kreiranja:</strong> {new Date().toLocaleDateString('sr-RS')}
                      </div>
                      <div>
                        <strong>Vrednost po smeni:</strong> {report.dnevnicaVrednost.toLocaleString()} RSD
                      </div>
                      <div>
                        <strong>Ukupno radnih sati:</strong> {report.ukupniSati}
                      </div>
                      <div>
                        <strong>Ukupna zarada:</strong> {report.ukupnaZarada.toLocaleString()} RSD
                      </div>
                    </div>
                  </div>

                  {/* Tabela radnika */}
                  <table className="w-full border-collapse border border-gray-300 mb-8">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                          Redni broj
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-left font-semibold">
                          Ime i prezime
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-center font-semibold">
                          Radni sati
                        </th>
                        <th className="border border-gray-300 px-4 py-3 text-right font-semibold">
                          Zarada (RSD)
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.radnici.map((radnik, index) => (
                        <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-4 py-3 text-center">
                            {index + 1}
                          </td>
                          <td className="border border-gray-300 px-4 py-3">
                            {radnik.ime}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-center font-semibold">
                            {radnik.radniSati}
                          </td>
                          <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                            {radnik.zarada.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                      {/* Ukupno red */}
                      <tr className="bg-blue-50 border-t-2 border-blue-300">
                        <td className="border border-gray-300 px-4 py-4 font-bold text-center" colSpan="2">
                          UKUPNO:
                        </td>
                        <td className="border border-gray-300 px-4 py-4 text-center font-bold text-blue-600">
                          {report.ukupniSati}
                        </td>
                        <td className="border border-gray-300 px-4 py-4 text-right font-bold text-blue-600">
                          {report.ukupnaZarada.toLocaleString()}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Statistike */}
                  <div className="grid grid-cols-3 gap-6 mb-8">
                    <div className="text-center p-4 border border-gray-300 rounded">
                      <div className="text-2xl font-bold text-blue-600">{report.radnici.length}</div>
                      <div className="text-sm text-gray-600">Ukupno radnika</div>
                    </div>
                    <div className="text-center p-4 border border-gray-300 rounded">
                      <div className="text-2xl font-bold text-green-600">{report.ukupniSati}</div>
                      <div className="text-sm text-gray-600">Ukupno radnih sati</div>
                    </div>
                    <div className="text-center p-4 border border-gray-300 rounded">
                      <div className="text-2xl font-bold text-purple-600">
                        {report.radnici.length > 0 ? (report.ukupniSati / report.radnici.length).toFixed(1) : 0}
                      </div>
                      <div className="text-sm text-gray-600">Prosek po radniku</div>
                    </div>
                  </div>

                  {/* Footer izveštaja */}
                  <div className="text-center text-sm text-gray-500 border-t pt-4">
                    <p>Izveštaj kreiran automatski - Evidencija radnih sati</p>
                    <p>AG Group © {new Date().getFullYear()}</p>
                  </div>

                  {/* Dugme za zatvaranje (samo na ekranu) */}
                  <div className="no-print fixed top-4 right-4">
                    <button
                      onClick={() => setShowReport(false)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Zatvori
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </>
  );
};

export default RadniciDnevniceApp;