import { validarBlueprint } from '../../blueprint/validator';

describe('Blueprint Validator', () => {
  test('debería validar un blueprint correcto', () => {
    const data = {
      id: '123',
      version: 1,
      usuario_id: 'user1',
      estudio_id: 'estudio1',
      fecha_creacion: '2026-04-13',
      nombre_obra: 'Casa Demo',
      ubicacion: 'Buenos Aires',
      superficie_cubierta_m2: 150,
      plantas: 1,
      tiene_planos: 'aprobados',
      estructura: 'albanileria',
      cubierta: 'chapa_acanalada',
      categoria: 'estandar',
      factor_terminacion: 1.35,
      pisos: 'ceramico',
      aberturas: 'aluminio_basico',
      cantidad_banos: 2,
      instalaciones: ['electrica', 'sanitaria'],
      terreno: {
        tipo: 'lote_propio',
        zona_inundable: false,
      },
      plazo_meses: 12,
      modalidad: 'llave_en_mano',
    };

    const result = validarBlueprint(data);
    expect(result.valido).toBe(true);
    expect(result.blueprint).toBeDefined();
    expect(result.blueprint?.factor_terminacion).toBe(1.35);
  });

  test('debería rechazar blueprint sin id', () => {
    const data = {
      version: 1,
      usuario_id: 'user1',
      // falta id
    } as any;
    const result = validarBlueprint(data);
    expect(result.valido).toBe(false);
    expect(result.errores.length).toBeGreaterThan(0);
  });

  test('debería corregir factor_terminacion incorrecto', () => {
    const data = {
      id: '123',
      version: 1,
      usuario_id: 'user1',
      estudio_id: 'estudio1',
      fecha_creacion: '2026-04-13',
      nombre_obra: 'Casa',
      ubicacion: 'Buenos Aires',
      superficie_cubierta_m2: 150,
      plantas: 1,
      tiene_planos: 'aprobados',
      estructura: 'albanileria',
      cubierta: 'chapa_acanalada',
      categoria: 'economico',
      factor_terminacion: 2.5, // incorrecto, debería ser 1.0
      pisos: 'ceramico',
      aberturas: 'aluminio_basico',
      cantidad_banos: 1,
      instalaciones: [],
      terreno: { tipo: 'lote_propio', zona_inundable: false },
      plazo_meses: 12,
      modalidad: 'llave_en_mano',
    };
    const result = validarBlueprint(data);
    // Aún debería ser válido pero con factor corregido
    expect(result.valido).toBe(true);
    expect(result.blueprint?.factor_terminacion).toBe(1.0);
  });
});