# MzClickTuner 🎵⏱️

> Afinador cromático de alta precisão e metrônomo de tempo real construído com **Svelte**, **TypeScript** e **Web Audio API**, projetado para funcionar 100% offline no telemóvel e desktop como uma PWA (Progressive Web App).

---

## 🎯 Sobre o Projeto

O **MzClickTuner** nasceu da necessidade de ter uma ferramenta musical confiável, rápida e sem anúncios para estudo diário. 

O projeto combina duas ferramentas indispensáveis para qualquer músico:
1. **Afinador Cromático:** Captura de sinal via microfone com filtro de corte de harmónicos secundários e algoritmo de autocorrelação no domínio do tempo, otimizado para instrumentos de frequências médias e graves.
2. **Metrônomo com Web Audio Scheduler:** Relógio de alta precisão desacoplado da *main thread* do JavaScript, eliminando qualquer instabilidade ou atraso (*jitter*) durante a reprodução.

---

## ✨ Funcionalidades

- **Detecção Cromática Automática:** Reconhecimento de notas e oitavas em tempo real.
- **Leitura em Cents:** Medição precisa de desvio tonal (de -50 a +50 cents) com indicador visual de afinação.
- **Metrônomo Estável:** Ajuste de 40 a 220 BPM com acentuação tonal no primeiro tempo do compasso (downbeat).
- **PWA Instalável e Offline:** Funciona sem ligação à Internet após a primeira visita; pode ser adicionado ao ecrã inicial do smartphone como aplicação nativa.
- **Bundle Ultraleve:** Compilação direta e sem overhead de Virtual DOM graças ao Svelte.

---

### 🧮 Precisão Matemática e Detecção Subamostral (Sub-sample Pitch Detection)

A detecção de altura pura por autocorrelação discreta no domínio do tempo calcula a frequência através da periodicidade do sinal:

$$f = \frac{f_s}{\tau}$$

Onde:
* $f_s$ é a taxa de amostragem do hardware (ex.: $44.100\text{ Hz}$ ou $48.000\text{ Hz}$).
* $\tau$ (*lag*) é o deslocamento de amostras onde a autocorrelação atinge o seu valor máximo local.

---

#### 1. A Limitação da Amostragem Discreta (Sample Quantization)

Como $\tau$ é restrito a um número inteiro de amostras ($\tau \in \mathbb{N}$), surge um degrau de quantização na frequência calculada. 

Tomando como exemplo a nota **$G_4$ ($391,995\text{ Hz}$)** a uma taxa de $f_s = 44.100\text{ Hz}$:
* Para $\tau = 112$:  
  $$f = \frac{44100}{112} = 393,75\text{ Hz}$$
* Para $\tau = 113$:  
  $$f = \frac{44100}{113} = 390,26\text{ Hz}$$

Sem tratamento fracionário, o algoritmo oscilaria entre $390,26\text{ Hz}$ e $393,75\text{ Hz}$, apresentando um erro sistemático de até **$1,75\text{ Hz}$** em relação à fundamental real.

---

#### 2. Interpolação Parabólica de Três Pontos (Vértice Fracionário)

Para atingir precisão milimétrica de frações de Hertz sem sobrecarregar a CPU com *upsampling*, o **MzClickTuner** aplica uma aproximação quadrática contínua local em torno do pico detectado $\tau_{\text{max}}$.

Considerando o valor do pico máximo local e seus vizinhos imediatos:
* $\alpha = R(\tau_{\text{max}} - 1)$
* $\beta = R(\tau_{\text{max}})$
* $\gamma = R(\tau_{\text{max}} + 1)$

O deslocamento fracionário contínuo $\Delta \in (-0.5, +0.5)$ em direção ao vértice da parábola é dado analiticamente por:

$$\Delta = \frac{\gamma - \alpha}{2(2\beta - \alpha - \gamma)}$$

O atraso periódico refinado passa a ser:

$$\tau_{\text{refinado}} = \tau_{\text{max}} + \Delta$$

E a frequência fundamental final:

$$f_0 = \frac{f_s}{\tau_{\text{refinado}}}$$

---

#### 3. Conversão para Semitons e Cálculo de Cents

Com a frequência $f_0$ obtida com precisão de hardware, a nota temperada mais próxima ($MIDI$) e seu desvio em *cents* (com base no Lá padrão de $440\text{ Hz}$) são determinados via escala logarítmica:

* **Índice MIDI:**
  $$n = 12 \cdot \log_2\left(\frac{f_0}{440}\right) + 69$$

* **Frequência Nominal Teórica da Nota ($f_n$):**
  $$f_n = 440 \cdot 2^{\frac{\text{round}(n) - 69}{12}}$$

* **Desvio em Cents (Precisão Angular da Agulha):**
  $$\text{cents} = 1200 \cdot \log_2\left(\frac{f_0}{f_n}\right)$$

A tolerância de travamento (*in-tune*) com feedback visual em verde neon e confirmação instantânea é definida em **$|\text{cents}| \le 3$**.

---

## 🛠️ Tecnologias Utilizadas

- [Svelte](https://svelte.dev/) + [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- **Web Audio API** (`AudioContext`, `AnalyserNode`, `BiquadFilterNode`, `OscillatorNode`)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)

---

## 🚀 Como Executar Localmente

### Pré-requisitos
- Node.js (v18+)
- npm ou pnpm

### Instalação

1. Clone o repositório:

```bash
git clone https://github.com/mazinhorj/MzClickTunerApp.git
cd MzClickTunerApp
```

2. Instale as dependências:

```bash
npm install
```

3. Inicie o servidor de desenvolvimento expondo na rede local:

```bash
npm run dev -- --host
```

4. Acesse através do seu navegador:

Local: http://localhost:5173

Dispositivo móvel (mesma rede Wi-Fi): http://<IP_DA_REDE>:5173

## 📱 Instalação no Dispositivo Móvel (PWA)
1. Abra a aplicação no navegador do telefone (Chrome no Android ou Safari no iOS).

2. Toque no menu de opções do navegador e selecione "Adicionar à tela principal" ou "Instalar aplicação".

3. O ícone do MzClickTunerApp surgirá junto das restantes aplicações do sistema, rodando em tela cheia e disponível em modo offline.

## 📄 Licença
_Distribuído sob a licença MIT. Consulte LICENSE para mais informações._

### Feito com carinho por MazinhoBigDaddy (Engenheiro de Software) 

## Propriedade Intelectual da [OM SOFTWARE &lt;ॐ/&gt;&reg;](https://omsoftware.com.br)