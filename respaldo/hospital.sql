--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5
-- Dumped by pg_dump version 17.5

-- Started on 2025-06-02 19:49:34

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 226 (class 1259 OID 16969)
-- Name: alas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alas (
    id integer NOT NULL,
    nombre character varying(50) NOT NULL
);


ALTER TABLE public.alas OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 16968)
-- Name: alas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alas_id_seq OWNER TO postgres;

--
-- TOC entry 5004 (class 0 OID 0)
-- Dependencies: 225
-- Name: alas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alas_id_seq OWNED BY public.alas.id;


--
-- TOC entry 230 (class 1259 OID 16988)
-- Name: camas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.camas (
    id integer NOT NULL,
    habitacion_id integer NOT NULL,
    paciente_id integer,
    estado character varying(20) DEFAULT 'libre_higienizada'::character varying NOT NULL,
    sexo character(1),
    CONSTRAINT camas_estado_check CHECK (((estado)::text = ANY ((ARRAY['libre_higienizada'::character varying, 'ocupada'::character varying, 'higienizando'::character varying])::text[])))
);


ALTER TABLE public.camas OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 16987)
-- Name: camas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.camas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.camas_id_seq OWNER TO postgres;

--
-- TOC entry 5005 (class 0 OID 0)
-- Dependencies: 229
-- Name: camas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.camas_id_seq OWNED BY public.camas.id;


--
-- TOC entry 224 (class 1259 OID 16949)
-- Name: derivaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.derivaciones (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    medico_id integer NOT NULL,
    motivo_derivacion text NOT NULL,
    creado_en timestamp without time zone DEFAULT now(),
    especialidad_derivacion character varying(100)
);


ALTER TABLE public.derivaciones OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 16948)
-- Name: derivaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.derivaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.derivaciones_id_seq OWNER TO postgres;

--
-- TOC entry 5006 (class 0 OID 0)
-- Dependencies: 223
-- Name: derivaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.derivaciones_id_seq OWNED BY public.derivaciones.id;


--
-- TOC entry 234 (class 1259 OID 17041)
-- Name: emergencias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.emergencias (
    id integer NOT NULL,
    motivo text NOT NULL,
    sexo character(1) NOT NULL,
    cama_id integer,
    creado_en timestamp without time zone DEFAULT now()
);


ALTER TABLE public.emergencias OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 17040)
-- Name: emergencias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.emergencias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.emergencias_id_seq OWNER TO postgres;

--
-- TOC entry 5007 (class 0 OID 0)
-- Dependencies: 233
-- Name: emergencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.emergencias_id_seq OWNED BY public.emergencias.id;


--
-- TOC entry 228 (class 1259 OID 16976)
-- Name: habitaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.habitaciones (
    id integer NOT NULL,
    ala_id integer NOT NULL,
    nombre character varying(50) NOT NULL
);


ALTER TABLE public.habitaciones OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 16975)
-- Name: habitaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.habitaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.habitaciones_id_seq OWNER TO postgres;

--
-- TOC entry 5008 (class 0 OID 0)
-- Dependencies: 227
-- Name: habitaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.habitaciones_id_seq OWNED BY public.habitaciones.id;


--
-- TOC entry 232 (class 1259 OID 17017)
-- Name: internaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.internaciones (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    habitacion_id integer NOT NULL,
    fecha_ingreso timestamp without time zone DEFAULT now() NOT NULL,
    fecha_egreso timestamp without time zone,
    motivo text
);


ALTER TABLE public.internaciones OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 17016)
-- Name: internaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.internaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.internaciones_id_seq OWNER TO postgres;

--
-- TOC entry 5009 (class 0 OID 0)
-- Dependencies: 231
-- Name: internaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.internaciones_id_seq OWNED BY public.internaciones.id;


--
-- TOC entry 222 (class 1259 OID 16942)
-- Name: medicos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.medicos (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    especialidad character varying(100),
    email character varying(120),
    usuario character varying(80),
    password character varying(100)
);


ALTER TABLE public.medicos OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 16941)
-- Name: medicos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.medicos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.medicos_id_seq OWNER TO postgres;

--
-- TOC entry 5010 (class 0 OID 0)
-- Dependencies: 221
-- Name: medicos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.medicos_id_seq OWNED BY public.medicos.id;


--
-- TOC entry 218 (class 1259 OID 16918)
-- Name: pacientes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.pacientes (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    direccion character varying(200),
    telefono character varying(30),
    contacto_emergencia character varying(30),
    fecha_nacimiento date,
    obra_social character varying(100),
    sexo character(1),
    created_at timestamp without time zone DEFAULT now(),
    email character varying(120),
    password character varying(100),
    dni character varying(20),
    tipo_sangre character varying(5),
    CONSTRAINT pacientes_sexo_check CHECK ((sexo = ANY (ARRAY['M'::bpchar, 'F'::bpchar]))),
    CONSTRAINT tipo_sangre_valido CHECK (((tipo_sangre)::text = ANY ((ARRAY['A+'::character varying, 'A-'::character varying, 'B+'::character varying, 'B-'::character varying, 'AB+'::character varying, 'AB-'::character varying, 'O+'::character varying, 'O-'::character varying])::text[])))
);


ALTER TABLE public.pacientes OWNER TO postgres;

--
-- TOC entry 217 (class 1259 OID 16917)
-- Name: pacientes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.pacientes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.pacientes_id_seq OWNER TO postgres;

--
-- TOC entry 5011 (class 0 OID 0)
-- Dependencies: 217
-- Name: pacientes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.pacientes_id_seq OWNED BY public.pacientes.id;


--
-- TOC entry 220 (class 1259 OID 16927)
-- Name: turnos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.turnos (
    id integer NOT NULL,
    paciente_id integer NOT NULL,
    motivo_turno text NOT NULL,
    creado_en timestamp without time zone DEFAULT now(),
    fecha timestamp without time zone DEFAULT now()
);


ALTER TABLE public.turnos OWNER TO postgres;

--
-- TOC entry 219 (class 1259 OID 16926)
-- Name: turnos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.turnos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.turnos_id_seq OWNER TO postgres;

--
-- TOC entry 5012 (class 0 OID 0)
-- Dependencies: 219
-- Name: turnos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.turnos_id_seq OWNED BY public.turnos.id;


--
-- TOC entry 4790 (class 2604 OID 16972)
-- Name: alas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alas ALTER COLUMN id SET DEFAULT nextval('public.alas_id_seq'::regclass);


--
-- TOC entry 4792 (class 2604 OID 16991)
-- Name: camas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camas ALTER COLUMN id SET DEFAULT nextval('public.camas_id_seq'::regclass);


--
-- TOC entry 4788 (class 2604 OID 16952)
-- Name: derivaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.derivaciones ALTER COLUMN id SET DEFAULT nextval('public.derivaciones_id_seq'::regclass);


--
-- TOC entry 4796 (class 2604 OID 17044)
-- Name: emergencias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergencias ALTER COLUMN id SET DEFAULT nextval('public.emergencias_id_seq'::regclass);


--
-- TOC entry 4791 (class 2604 OID 16979)
-- Name: habitaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habitaciones ALTER COLUMN id SET DEFAULT nextval('public.habitaciones_id_seq'::regclass);


--
-- TOC entry 4794 (class 2604 OID 17020)
-- Name: internaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internaciones ALTER COLUMN id SET DEFAULT nextval('public.internaciones_id_seq'::regclass);


--
-- TOC entry 4787 (class 2604 OID 16945)
-- Name: medicos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicos ALTER COLUMN id SET DEFAULT nextval('public.medicos_id_seq'::regclass);


--
-- TOC entry 4782 (class 2604 OID 16921)
-- Name: pacientes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacientes ALTER COLUMN id SET DEFAULT nextval('public.pacientes_id_seq'::regclass);


--
-- TOC entry 4784 (class 2604 OID 16930)
-- Name: turnos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turnos ALTER COLUMN id SET DEFAULT nextval('public.turnos_id_seq'::regclass);


--
-- TOC entry 4990 (class 0 OID 16969)
-- Dependencies: 226
-- Data for Name: alas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alas (id, nombre) FROM stdin;
5	Ala 1
6	Emergencias
7	Ala 2
\.


--
-- TOC entry 4994 (class 0 OID 16988)
-- Dependencies: 230
-- Data for Name: camas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.camas (id, habitacion_id, paciente_id, estado, sexo) FROM stdin;
67	8	20	ocupada	M
63	8	\N	higienizando	M
68	10	15	ocupada	F
62	9	\N	libre_higienizada	F
61	9	\N	libre_higienizada	M
\.


--
-- TOC entry 4988 (class 0 OID 16949)
-- Dependencies: 224
-- Data for Name: derivaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.derivaciones (id, paciente_id, medico_id, motivo_derivacion, creado_en, especialidad_derivacion) FROM stdin;
4	20	4	Al final tiene pulmonia	2025-06-02 18:56:37.117807	neumonología
\.


--
-- TOC entry 4998 (class 0 OID 17041)
-- Dependencies: 234
-- Data for Name: emergencias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.emergencias (id, motivo, sexo, cama_id, creado_en) FROM stdin;
1	Le duele el pechamen de la herida de bala	M	61	2025-06-01 22:22:20.769669
2	Herida de bala	F	62	2025-06-01 22:37:48.23015
\.


--
-- TOC entry 4992 (class 0 OID 16976)
-- Dependencies: 228
-- Data for Name: habitaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.habitaciones (id, ala_id, nombre) FROM stdin;
8	5	Habitacion 1
9	6	Emergencias
10	7	Habitacion 2
\.


--
-- TOC entry 4996 (class 0 OID 17017)
-- Dependencies: 232
-- Data for Name: internaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.internaciones (id, paciente_id, habitacion_id, fecha_ingreso, fecha_egreso, motivo) FROM stdin;
\.


--
-- TOC entry 4986 (class 0 OID 16942)
-- Dependencies: 222
-- Data for Name: medicos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.medicos (id, nombre, especialidad, email, usuario, password) FROM stdin;
1	Dr. Juan PÃ©rez	Medicina General	\N	\N	\N
2	Dra. MarÃ­a LÃ³pez	CardiologÃ­a	\N	\N	\N
3	jeremias	Farmaceutico	jere.sosa.322@gmail.com	Lokyy322	$2b$10$hXp3nwENDKOiKqdsHJBJcOcVzokOqo20n/xYuXNAOwRgZ8M5X.wIe
4	Daniela	Cardiologa	yodaniela37@gmail.com	Loki	$2b$10$2m6UTDC0mTvLCmDJENrFCOmCwKvVW5WDbkRFye/SjCIp1kVCTJMTq
\.


--
-- TOC entry 4982 (class 0 OID 16918)
-- Dependencies: 218
-- Data for Name: pacientes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.pacientes (id, nombre, direccion, telefono, contacto_emergencia, fecha_nacimiento, obra_social, sexo, created_at, email, password, dni, tipo_sangre) FROM stdin;
15	Becky g	Un lugar de millonario	112233445566	7788994455	2010-06-17	Pami	F	2025-06-01 20:40:06.218821	\N	\N	10963621	AB+
20	Jeremias	\N	2657244771	\N	\N	\N	M	2025-06-02 18:51:29.784133	jere.sosa.322@gmail.com	$2b$10$vkEsNZrso7S6FxIgunW.ReKE9b2Vjfhq6XpvI2gOx5vgljT6aXE.a	10584774	A+
\.


--
-- TOC entry 4984 (class 0 OID 16927)
-- Dependencies: 220
-- Data for Name: turnos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.turnos (id, paciente_id, motivo_turno, creado_en, fecha) FROM stdin;
5	15	Me lele la cabecha	2025-06-01 20:40:06.219869	2025-06-02 18:55:16.53542
9	20	Lele pancha	2025-06-02 18:56:16.629982	2025-06-02 18:56:16.629982
\.


--
-- TOC entry 5013 (class 0 OID 0)
-- Dependencies: 225
-- Name: alas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alas_id_seq', 7, true);


--
-- TOC entry 5014 (class 0 OID 0)
-- Dependencies: 229
-- Name: camas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.camas_id_seq', 68, true);


--
-- TOC entry 5015 (class 0 OID 0)
-- Dependencies: 223
-- Name: derivaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.derivaciones_id_seq', 4, true);


--
-- TOC entry 5016 (class 0 OID 0)
-- Dependencies: 233
-- Name: emergencias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.emergencias_id_seq', 2, true);


--
-- TOC entry 5017 (class 0 OID 0)
-- Dependencies: 227
-- Name: habitaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.habitaciones_id_seq', 10, true);


--
-- TOC entry 5018 (class 0 OID 0)
-- Dependencies: 231
-- Name: internaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.internaciones_id_seq', 1, false);


--
-- TOC entry 5019 (class 0 OID 0)
-- Dependencies: 221
-- Name: medicos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.medicos_id_seq', 4, true);


--
-- TOC entry 5020 (class 0 OID 0)
-- Dependencies: 217
-- Name: pacientes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.pacientes_id_seq', 20, true);


--
-- TOC entry 5021 (class 0 OID 0)
-- Dependencies: 219
-- Name: turnos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.turnos_id_seq', 9, true);


--
-- TOC entry 4818 (class 2606 OID 16974)
-- Name: alas alas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alas
    ADD CONSTRAINT alas_pkey PRIMARY KEY (id);


--
-- TOC entry 4822 (class 2606 OID 16995)
-- Name: camas camas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camas
    ADD CONSTRAINT camas_pkey PRIMARY KEY (id);


--
-- TOC entry 4816 (class 2606 OID 16957)
-- Name: derivaciones derivaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.derivaciones
    ADD CONSTRAINT derivaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4802 (class 2606 OID 17038)
-- Name: pacientes dni_unico; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT dni_unico UNIQUE (dni);


--
-- TOC entry 4826 (class 2606 OID 17049)
-- Name: emergencias emergencias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergencias
    ADD CONSTRAINT emergencias_pkey PRIMARY KEY (id);


--
-- TOC entry 4820 (class 2606 OID 16981)
-- Name: habitaciones habitaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habitaciones
    ADD CONSTRAINT habitaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4824 (class 2606 OID 17023)
-- Name: internaciones internaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internaciones
    ADD CONSTRAINT internaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 4810 (class 2606 OID 17007)
-- Name: medicos medicos_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicos
    ADD CONSTRAINT medicos_email_key UNIQUE (email);


--
-- TOC entry 4812 (class 2606 OID 16947)
-- Name: medicos medicos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicos
    ADD CONSTRAINT medicos_pkey PRIMARY KEY (id);


--
-- TOC entry 4814 (class 2606 OID 17009)
-- Name: medicos medicos_usuario_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.medicos
    ADD CONSTRAINT medicos_usuario_key UNIQUE (usuario);


--
-- TOC entry 4804 (class 2606 OID 17013)
-- Name: pacientes pacientes_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT pacientes_email_key UNIQUE (email);


--
-- TOC entry 4806 (class 2606 OID 16925)
-- Name: pacientes pacientes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.pacientes
    ADD CONSTRAINT pacientes_pkey PRIMARY KEY (id);


--
-- TOC entry 4808 (class 2606 OID 16935)
-- Name: turnos turnos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turnos
    ADD CONSTRAINT turnos_pkey PRIMARY KEY (id);


--
-- TOC entry 4831 (class 2606 OID 16996)
-- Name: camas camas_habitacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camas
    ADD CONSTRAINT camas_habitacion_id_fkey FOREIGN KEY (habitacion_id) REFERENCES public.habitaciones(id) ON DELETE CASCADE;


--
-- TOC entry 4832 (class 2606 OID 17001)
-- Name: camas camas_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.camas
    ADD CONSTRAINT camas_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id);


--
-- TOC entry 4828 (class 2606 OID 16963)
-- Name: derivaciones derivaciones_medico_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.derivaciones
    ADD CONSTRAINT derivaciones_medico_id_fkey FOREIGN KEY (medico_id) REFERENCES public.medicos(id);


--
-- TOC entry 4829 (class 2606 OID 16958)
-- Name: derivaciones derivaciones_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.derivaciones
    ADD CONSTRAINT derivaciones_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE;


--
-- TOC entry 4835 (class 2606 OID 17050)
-- Name: emergencias emergencias_cama_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.emergencias
    ADD CONSTRAINT emergencias_cama_id_fkey FOREIGN KEY (cama_id) REFERENCES public.camas(id) ON DELETE SET NULL;


--
-- TOC entry 4830 (class 2606 OID 16982)
-- Name: habitaciones habitaciones_ala_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.habitaciones
    ADD CONSTRAINT habitaciones_ala_id_fkey FOREIGN KEY (ala_id) REFERENCES public.alas(id) ON DELETE CASCADE;


--
-- TOC entry 4833 (class 2606 OID 17029)
-- Name: internaciones internaciones_habitacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internaciones
    ADD CONSTRAINT internaciones_habitacion_id_fkey FOREIGN KEY (habitacion_id) REFERENCES public.habitaciones(id);


--
-- TOC entry 4834 (class 2606 OID 17024)
-- Name: internaciones internaciones_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.internaciones
    ADD CONSTRAINT internaciones_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id);


--
-- TOC entry 4827 (class 2606 OID 16936)
-- Name: turnos turnos_paciente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.turnos
    ADD CONSTRAINT turnos_paciente_id_fkey FOREIGN KEY (paciente_id) REFERENCES public.pacientes(id) ON DELETE CASCADE;


-- Completed on 2025-06-02 19:49:34

--
-- PostgreSQL database dump complete
--

