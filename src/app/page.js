'use client';

import React, { useState, useEffect } from 'react';

export default function TimesheetApp() {
  // State za sve radnike
  const [radnici, setRadnici] = useState([]);
  const [noviRadnik, setNoviRadnik] = useState({ ime: '', prezime: '', satnica: '' });
  const [showForm, setShowForm] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [saveMessage, setSaveMessage] = useState('');

  // Učitavanje podataka iz localStorage kada se komponenta pokrene
  useEffect(() => {
    const savedRadnici = localStorage.getItem('radnici');
    if (savedRadnici) {
      setRadnici(JSON.parse(savedRadnici));
    }
  }, []);

  // Funkcija za čuvanje u localStorage
  const sacuvajPodatke = () => {
    localStorage.setItem('radnici', JSON.stringify(radnici));
    setSaveMessage('✅ Podaci su uspešno sačuvani!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  // Funkcija za generisanje PDF-a
  const generirajPDF = () => {
    const mesecNaziv = meseci[selectedMonth];
    const ukupno = ukupnoZaSve();
    
    // Kreiranje sadržaja za PDF
    let pdfSadrzaj = `
EVIDENCIJA RADNIH SATI - ${mesecNaziv} ${selectedYear}
AG Group
==========================================

`;

    radnici.forEach(radnik => {
      const kalkulacija = kalkulisiZaRadnika(radnik);
      pdfSadrzaj += `
${radnik.ime} ${radnik.prezime}
Satnica: ${radnik.satnica} RSD
Ukupno smena: ${kalkulacija.ukupnoSati}
Zarada: ${kalkulacija.zarada.toLocaleString()} RSD
------------------------------------------
`;
    });

    pdfSadrzaj += `
UKUPNO:
Radnika: ${radnici.length}
Smena: ${ukupno.ukupnoSati}
Zarada: ${ukupno.ukupnaZarada.toLocaleString()} RSD

Generisano: ${new Date().toLocaleDateString('sr-RS')}
`;

    // Kreiranje i download fajla
    const blob = new Blob([pdfSadrzaj], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `evidencija-${mesecNaziv}-${selectedYear}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const meseci = [
    'Januar', 'Februar', 'Mart', 'April', 'Maj', 'Jun',
    'Jul', 'Avgust', 'Septembar', 'Oktobar', 'Novembar', 'Decembar'
  ];

  // Dodavanje novog radnika
  const dodajRadnika = () => {
    const ime = noviRadnik.ime.trim();
    const prezime = noviRadnik.prezime.trim();
    const satnica = parseFloat(noviRadnik.satnica);
    
    if (ime && prezime && !isNaN(satnica) && satnica > 0) {
      const radnik = {
        id: Date.now(),
        ime: ime,
        prezime: prezime,
        satnica: satnica,
        sati: {}
      };
      setRadnici([...radnici, radnik]);
      setNoviRadnik({ ime: '', prezime: '', satnica: '' });
      setShowForm(false);
    } else {
      alert('Molimo unesite sva polja sa validnim brojevima!');
    }
  };

  // Ažuriranje satnice radnika
  const updateSatnicu = (radnikId, novaSatnica) => {
    const satnica = parseFloat(novaSatnica);
    if (!isNaN(satnica) && satnica >= 0) {
      setRadnici(radnici.map(radnik => 
        radnik.id === radnikId 
          ? { ...radnik, satnica: satnica }
          : radnik
      ));
    }
  };

  // Toggle sati za radnika (0 -> 0.5 -> 1 -> 0)
  const toggleSati = (radnikId, year, month, day) => {
    const key = `${year}-${month}-${day}`;
    setRadnici(radnici.map(radnik => {
      if (radnik.id === radnikId) {
        const trenutnoSati = (radnik.sati && radnik.sati[key]) || 0;
        let novoSati;
        if (trenutnoSati === 0) {
          novoSati = 0.5; // Pola dnevnice
        } else if (trenutnoSati === 0.5) {
          novoSati = 1; // Cela dnevnica
        } else {
          novoSati = 0; // Bez rada
        }
        return { 
          ...radnik, 
          sati: { ...(radnik.sati || {}), [key]: novoSati }
        };
      }
      return radnik;
    }));
  };

  // Brisanje radnika
  const obrisiRadnika = (radnikId) => {
    setRadnici(radnici.filter(radnik => radnik.id !== radnikId));
  };

  // Kalkulacija za radnika
  const kalkulisiZaRadnika = (radnik) => {
    if (!radnik || !radnik.satnica || isNaN(radnik.satnica)) {
      return {
        ukupnoSati: 0,
        zarada: 0
      };
    }

    // Računamo sve dane u trenutno izabranom mesecu
    const ukupnoSati = Object.entries(radnik.sati || {})
      .filter(([key]) => {
        const [year, month] = key.split('-').map(Number);
        return year === selectedYear && month === selectedMonth;
      })
      .reduce((sum, [, sati]) => sum + (sati || 0), 0);
    
    return {
      ukupnoSati: ukupnoSati,
      zarada: ukupnoSati * radnik.satnica
    };
  };

  // Ukupno za sve radnike
  const ukupnoZaSve = () => {
    return radnici.reduce((total, radnik) => {
      const kalkulacija = kalkulisiZaRadnika(radnik);
      return {
        ukupnoSati: total.ukupnoSati + kalkulacija.ukupnoSati,
        ukupnaZarada: total.ukupnaZarada + kalkulacija.zarada
      };
    }, { ukupnoSati: 0, ukupnaZarada: 0 });
  };

  // Dobijanje broja dana u mesecu
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Dobijanje naziva dana u nedelji
  const getDayName = (year, month, day) => {
    const date = new Date(year, month, day);
    const days = ['Ned', 'Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub'];
    return days[date.getDay()];
  };

  // Dobijanje prve nedelje meseca (počinje od ponedeljka)
  const getFirstWeekStart = (year, month) => {
    const firstDay = new Date(year, month, 1);
    const dayOfWeek = firstDay.getDay();
    const mondayOffset = dayOfWeek === 0 ? -6 : -(dayOfWeek - 1);
    const monday = new Date(firstDay);
    monday.setDate(firstDay.getDate() + mondayOffset);
    return monday;
  };

  // Dobijanje svih dana u kalendarskom prikazu (6 nedelja x 7 dana)
  const getCalendarDays = (year, month) => {
    const days = [];
    const startDate = getFirstWeekStart(year, month);
    
    for (let i = 0; i < 42; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      days.push({
        date: currentDate.getDate(),
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        isCurrentMonth: currentDate.getMonth() === month,
        dayName: getDayName(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate())
      });
    }
    
    return days;
  };

  // Provera da li je dan vikend
  const isWeekend = (year, month, day) => {
    const date = new Date(year, month, day);
    return date.getDay() === 0 || date.getDay() === 6;
  };

  // Dobijanje boje za dan na osnovu sati
  const getDayColor = (radnik, year, month, day) => {
    const key = `${year}-${month}-${day}`;
    const sati = (radnik.sati && radnik.sati[key]) || 0;
    
    if (sati === 0) return 'bg-gray-100 hover:bg-gray-200';
    if (sati === 0.5) return 'bg-yellow-200 hover:bg-yellow-300';
    if (sati === 1) return 'bg-green-200 hover:bg-green-300';
    return 'bg-gray-100 hover:bg-gray-200';
  };

  // Dobijanje ikone za dan na osnovu sati
  const getDayIcon = (radnik, year, month, day) => {
    const key = `${year}-${month}-${day}`;
    const sati = (radnik.sati && radnik.sati[key]) || 0;
    
    if (sati === 0) return '';
    if (sati === 0.5) return '🌗';
    if (sati === 1) return '✅';
    return '';
  };

  const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
  const ukupno = ukupnoZaSve();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">📊 Evidencija radnih sati</h1>
          <div className="flex flex-wrap gap-2 sm:gap-3">
            <button 
              onClick={sacuvajPodatke}
              className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              💾 Sačuvaj
            </button>
            <button 
              onClick={generirajPDF}
              className="bg-purple-600 hover:bg-purple-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm sm:text-base"
            >
              📄 PDF
            </button>
            <button 
              onClick={() => setShowForm(!showForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
            >
              {showForm ? '❌ Otkaži' : '➕ Dodaj radnika'}
            </button>
          </div>
        </div>

        {/* Poruka o čuvanju */}
        {saveMessage && (
          <div className="mb-4 p-3 bg-green-100 border border-green-300 text-green-800 rounded-lg">
            {saveMessage}
          </div>
        )}

        {/* Forma za dodavanje radnika */}
        {showForm && (
          <div className="bg-white p-6 rounded-xl shadow-lg mb-8">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">➕ Dodaj radnika</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <input
                type="text"
                placeholder="Ime radnika"
                value={noviRadnik.ime}
                onChange={(e) => setNoviRadnik({...noviRadnik, ime: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
              <input
                type="text"
                placeholder="Prezime"
                value={noviRadnik.prezime}
                onChange={(e) => setNoviRadnik({...noviRadnik, prezime: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
              <input
                type="number"
                placeholder="Po smeni: 2500 RSD"
                value={noviRadnik.satnica}
                onChange={(e) => setNoviRadnik({...noviRadnik, satnica: e.target.value})}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
              />
              <button 
                onClick={dodajRadnika}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base"
              >
                ✅ Dodaj
              </button>
            </div>
          </div>
        )}

        {/* Lista radnika */}
        <div className="bg-white rounded-xl shadow-lg mb-6">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-2xl font-semibold text-gray-800">👥 Lista radnika</h2>
            {radnici.length === 0 && (
              <p className="text-gray-500 mt-2">Nema unetih radnika</p>
            )}
          </div>
          
          {radnici.map(radnik => {
            const kalkulacija = kalkulisiZaRadnika(radnik);
            return (
              <div key={radnik.id} className="p-4 sm:p-6 border-b border-gray-100 last:border-b-0">
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">
                      {radnik.ime} {radnik.prezime}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="text-gray-600 text-sm">Satnica:</span>
                      <input
                        type="number"
                        value={radnik.satnica || ''}
                        onChange={(e) => updateSatnicu(radnik.id, e.target.value)}
                        className="w-20 sm:w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                        placeholder="2500"
                      />
                      <span className="text-gray-600 text-sm">RSD</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full lg:w-auto">
                    <div className="text-center sm:text-right">
                      <p className="text-xs sm:text-sm text-gray-600">Ukupno smena</p>
                      <p className="text-lg sm:text-xl font-bold text-blue-600">{kalkulacija.ukupnoSati}</p>
                    </div>
                    <div className="text-center sm:text-right">
                      <p className="text-xs sm:text-sm text-gray-600">Zarada</p>
                      <p className="text-lg sm:text-xl font-bold text-green-600">{kalkulacija.zarada.toLocaleString()} RSD</p>
                    </div>
                    <button 
                      onClick={() => obrisiRadnika(radnik.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-2 sm:px-3 py-1 rounded-lg text-xs sm:text-sm transition-colors"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Kalendar radnih sati */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-xl sm:text-2xl font-semibold text-gray-800">📅 Kalendar radnih sati</h2>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                <select 
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  {meseci.map((mesec, index) => (
                    <option key={index} value={index}>{mesec}</option>
                  ))}
                </select>
                <select 
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm sm:text-base"
                >
                  <option value={2024}>2024</option>
                  <option value={2025}>2025</option>
                  <option value={2026}>2026</option>
                </select>
              </div>
            </div>
          </div>

          {radnici.length > 0 ? (
            <div className="p-6">
              {radnici.map(radnik => {
                const kalkulacija = kalkulisiZaRadnika(radnik);
                return (
                  <div key={radnik.id} className="mb-6 sm:mb-8 bg-gray-50 p-3 sm:p-4 rounded-lg">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 sm:gap-4 mb-4">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                        {radnik.ime} {radnik.prezime}
                      </h3>
                      <div className="flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                        <span className="text-blue-600 font-medium">Smene: {kalkulacija.ukupnoSati}</span>
                        <span className="text-green-600 font-medium">{kalkulacija.zarada.toLocaleString()} RSD</span>
                      </div>
                    </div>
                    
                    {/* Kalendar grid - header sa danima u nedelji */}
                    <div className="grid grid-cols-7 gap-1 mb-2">
                      {['Pon', 'Uto', 'Sre', 'Čet', 'Pet', 'Sub', 'Ned'].map(dan => (
                        <div key={dan} className="text-center text-xs sm:text-sm font-semibold text-gray-600 py-1 sm:py-2">
                          {dan}
                        </div>
                      ))}
                    </div>
                    
                    {/* Kalendar grid - dani */}
                    <div className="grid grid-cols-7 gap-1">
                      {getCalendarDays(selectedYear, selectedMonth).map((dayData, index) => {
                        const { date, month, year, isCurrentMonth, dayName } = dayData;
                        const weekend = isWeekend(year, month, date);
                        const colorClass = getDayColor(radnik, year, month, date);
                        const icon = getDayIcon(radnik, year, month, date);
                        
                        return (
                          <div
                            key={index}
                            onClick={() => isCurrentMonth && toggleSati(radnik.id, year, month, date)}
                            className={`
                              ${isCurrentMonth ? colorClass : 'bg-gray-50 text-gray-300'} 
                              ${weekend && isCurrentMonth ? 'border-red-300' : 'border-gray-300'}
                              ${isCurrentMonth ? 'cursor-pointer hover:shadow-md' : 'cursor-default'}
                              border-2 rounded-lg p-1 sm:p-2 transition-colors
                              flex flex-col items-center justify-center min-h-8 sm:min-h-12
                            `}
                          >
                            <div className="text-xs sm:text-sm font-bold">{date}</div>
                            {isCurrentMonth && <div className="text-xs sm:text-sm">{icon}</div>}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

              {/* Ukupno za sve radnike */}
              <div className="mt-6 bg-gradient-to-r from-green-500 to-blue-500 text-white p-4 sm:p-6 rounded-xl">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div>
                    <h3 className="text-sm sm:text-lg font-semibold mb-2">👥 Ukupno radnika</h3>
                    <p className="text-2xl sm:text-3xl font-bold">{radnici.length}</p>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-lg font-semibold mb-2">⏰ Ukupno smena</h3>
                    <p className="text-2xl sm:text-3xl font-bold">{ukupno.ukupnoSati}</p>
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-lg font-semibold mb-2">💰 Ukupna zarada</h3>
                    <p className="text-2xl sm:text-3xl font-bold">{ukupno.ukupnaZarada.toLocaleString()} RSD</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <p className="text-xl">📋 Dodajte radnika da biste uredili kalendar</p>
              <p className="mt-2">by AG Group</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}