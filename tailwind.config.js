import defaultTheme from 'tailwindcss/defaultTheme';
import forms from '@tailwindcss/forms';

/*
 * Identidade "Pinho & Ocre" — ver docs/design-system/DESIGN-TOKENS.md.
 *
 * Cada família tem um papel fixo:
 * - areia: neutros quentes (fundo, texto, bordas)
 * - pinho: marca, ação principal e estado "concluído / livre"
 * - ocre: atenção e espera (sempre com texto escuro)
 * - tijolo: atraso, erro, ação destrutiva
 * - aco: em operação / informação
 * - couro: categoria secundária (substitui roxos legados)
 *
 * As paletas padrão do Tailwind usadas no código legado são redirecionadas
 * para essas famílias, para que nenhuma tela fique com azul elétrico, roxo
 * ou cinza frio.
 */
const areia = {
  50: '#FAF8F3',
  100: '#F5F1E8',
  200: '#E8E2D5',
  300: '#D6CEBD',
  400: '#857D6C',
  500: '#6E6758',
  600: '#5C5648',
  700: '#4A4539',
  800: '#34312A',
  900: '#252320',
  950: '#1A1916',
};

const pinho = {
  50: '#EEF4EF',
  100: '#DCE8DF',
  200: '#B9D1BF',
  300: '#8DB39A',
  400: '#5E9072',
  500: '#3D7356',
  600: '#2B5D45',
  700: '#214B38',
  800: '#1A3C2D',
  900: '#142E23',
  950: '#0C1D16',
};

const ocre = {
  50: '#FDF7E8',
  100: '#F9EBC6',
  200: '#F2D68E',
  300: '#E8BD55',
  400: '#DDA530',
  500: '#C98A1B',
  600: '#A86D12',
  700: '#865412',
  800: '#6B4314',
  900: '#583814',
  950: '#321E07',
};

const tijolo = {
  50: '#FCF1EE',
  100: '#F8DED7',
  200: '#F0BCAF',
  300: '#E4917F',
  400: '#D36652',
  500: '#BF4A35',
  600: '#A5392A',
  700: '#892E23',
  800: '#712921',
  900: '#5E2620',
  950: '#33110D',
};

const aco = {
  50: '#F1F5F7',
  100: '#DFE8ED',
  200: '#C1D2DC',
  300: '#97B3C3',
  400: '#6A8EA3',
  500: '#4E7389',
  600: '#3E5D72',
  700: '#354C5D',
  800: '#2F414E',
  900: '#2B3843',
  950: '#1C252D',
};

const couro = {
  50: '#F8F3EF',
  100: '#EFE3D9',
  200: '#DFC6B2',
  300: '#CBA285',
  400: '#B7805E',
  500: '#A36A48',
  600: '#8C573C',
  700: '#724634',
  800: '#5E3B2F',
  900: '#4F3329',
  950: '#2A1914',
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
                sans: ['"Source Sans 3"', ...defaultTheme.fontFamily.sans],
                display: ['"Libre Franklin"', '"Source Sans 3"', ...defaultTheme.fontFamily.sans],
                mono: ['"IBM Plex Mono"', ...defaultTheme.fontFamily.mono],
            },
            colors: {
                areia,
                pinho,
                ocre,
                tijolo,
                aco,
                couro,
                brand: pinho,

                slate: areia,
                gray: areia,
                zinc: areia,
                neutral: areia,
                stone: areia,
                teal: pinho,
                emerald: pinho,
                green: pinho,
                lime: pinho,
                blue: aco,
                sky: aco,
                cyan: aco,
                indigo: aco,
                amber: ocre,
                yellow: ocre,
                orange: ocre,
                red: tijolo,
                rose: tijolo,
                pink: tijolo,
                violet: couro,
                purple: couro,
                fuchsia: couro,
            },
            borderRadius: {
                sm: '4px',
                DEFAULT: '6px',
                md: '6px',
                lg: '8px',
                xl: '10px',
                '2xl': '12px',
                '3xl': '16px',
            },
            boxShadow: {
                sm: '0 1px 2px rgb(37 35 32 / 0.06)',
                DEFAULT: '0 1px 3px rgb(37 35 32 / 0.08), 0 1px 2px rgb(37 35 32 / 0.04)',
                md: '0 4px 10px -2px rgb(37 35 32 / 0.10)',
                lg: '0 12px 24px -8px rgb(37 35 32 / 0.18)',
                xl: '0 20px 40px -12px rgb(37 35 32 / 0.24)',
                '2xl': '0 28px 56px -16px rgb(37 35 32 / 0.30)',
            },
        },
    },

    plugins: [forms],
};
