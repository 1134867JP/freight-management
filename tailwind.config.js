import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/*
 * Linguagem visual "pátio / sinalização".
 *
 * - concrete: neutro quente (concreto, asfalto). Substitui slate e gray em todo o app.
 * - brand: 50–500 são o amarelo de segurança (destaques, foco, tintas claras);
 *   600–800 são o preto de sinalização (botões primários, links, texto de ação);
 *   900–950 são tintas escuras do amarelo para o modo escuro.
 * - signal / ink: nomes explícitos para código novo.
 */
const concrete = {
  50: '#F7F6F3',
  100: '#EDEBE6',
  200: '#DDDAD3',
  300: '#C5C1B8',
  400: '#9B968C',
  500: '#737067',
  600: '#57544E',
  700: '#3E3C38',
  800: '#2A2927',
  900: '#1C1B1A',
  950: '#121211',
};

const signal = {
  50: '#FFFBE5',
  100: '#FFF3B8',
  200: '#FFE680',
  300: '#FFD83D',
  400: '#F5C400',
  500: '#D9AC00',
  600: '#A88500',
  700: '#7A6100',
  800: '#4D3D00',
  900: '#332900',
  950: '#1F1900',
};

const ink = {
  DEFAULT: '#141413',
  soft: '#2A2927',
};

const brand = {
  50: signal[50],
  100: signal[100],
  200: signal[200],
  300: signal[300],
  400: signal[400],
  500: signal[500],
  600: '#2A2927',
  700: '#141413',
  800: '#000000',
  900: signal[900],
  950: signal[950],
};

/** @type {import('tailwindcss').Config} */
export default {
    darkMode: 'class',

    content: [
        './vendor/laravel/framework/src/Illuminate/Pagination/resources/views/*.blade.php',
        './storage/framework/views/*.php',
        './resources/views/**/*.blade.php',
        './resources/js/**/*.jsx',
    ],

    theme: {
        extend: {
            fontFamily: {
                sans: ['Barlow', ...defaultTheme.fontFamily.sans],
                display: ['"Barlow Condensed"', 'Barlow', ...defaultTheme.fontFamily.sans],
                mono: ['"IBM Plex Mono"', ...defaultTheme.fontFamily.mono],
            },
            colors: {
                brand,
                signal,
                ink,
                concrete,
                slate: concrete,
                gray: concrete,
                blue: brand,
            },
            borderRadius: {
                sm: '1px',
                DEFAULT: '2px',
                md: '2px',
                lg: '3px',
                xl: '4px',
                '2xl': '4px',
                '3xl': '6px',
            },
            boxShadow: {
                sm: '0 1px 0 rgb(20 20 19 / 0.05)',
                DEFAULT: '0 1px 0 rgb(20 20 19 / 0.06)',
                md: '0 2px 0 rgb(20 20 19 / 0.08)',
                lg: '0 14px 32px -14px rgb(20 20 19 / 0.35)',
                xl: '0 20px 44px -18px rgb(20 20 19 / 0.45)',
                '2xl': '0 28px 60px -20px rgb(20 20 19 / 0.5)',
                plate: '4px 4px 0 0 rgb(20 20 19)',
            },
        },
    },

    plugins: [forms],
};
