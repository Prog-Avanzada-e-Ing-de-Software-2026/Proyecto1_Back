import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Linea } from 'src/modules/gestion-productos/linea/domain/entities/linea.entity';
import { Marca } from 'src/modules/gestion-productos/marca/domain/entities/marca.entity';
import { SuperLinea } from 'src/modules/gestion-productos/superlinea/domain/entities/superlinea.entity';
import { Usuario } from 'src/modules/gestion-usuario/usuario/domain/entities/usuario.entity';
import { Proveedor } from 'src/modules/organizacion/proveedor/domain/entities/proveedor.entity';
import { DeepPartial, Repository } from 'typeorm';

@Injectable()
export class SeedFamiliaProductoService {
  constructor(

    @InjectRepository(Linea)
    private readonly lineaRepository: Repository<Linea>,

    @InjectRepository(Marca)
    private readonly marcaRepository: Repository<Marca>,



    @InjectRepository(Proveedor)
    private readonly proveedorRepository: Repository<Proveedor>,

    @InjectRepository(Usuario)
    private readonly usuarioRepository: Repository<Usuario>,

    @InjectRepository(SuperLinea)
    private readonly superLineaRepository: Repository<SuperLinea>,


  ) {}


  // Seed of SuperLineas
  async seedSuperLineas() {
    const entryData = [
      { denominacion: 'ALMACÉN', usuarioCreatedId: 1 },
      { denominacion: 'BOLSAS Y DESCARTABLES', usuarioCreatedId: 1 },
    ];

    for (const data of entryData) {
      const exists = await this.superLineaRepository.findOneBy({
        denominacion: data.denominacion.toUpperCase(),
      });

      if (!exists) {
        const usuarioCreated = await this.usuarioRepository.findOneBy({
          id: data.usuarioCreatedId,
        });

        if (!usuarioCreated) {
          console.log(
            `⚠️ No se encontró el usuario "${data.usuarioCreatedId}".`,
          );
          continue;
        }

        const superLinea = this.superLineaRepository.create({
          denominacion: data.denominacion.toUpperCase(),
          usuarioCreatedId: usuarioCreated.id,
        } as DeepPartial<SuperLinea>);

        await this.superLineaRepository.save(superLinea);
        console.log(`✅ SuperLinea "${data.denominacion}" created.`);
      } else {
        console.log(`⚠️ SuperLinea "${data.denominacion}" already exists.`);
      }
    }
  }

  async seedLineas() {
    const entryData = [
      {
        denominacion: 'Aceites',
        superLinea: 'ALMACÉN',
        sistema: 0,
        usuarioCreatedId: 1,
      },

      {
        denominacion: 'Aceitunas',
        superLinea: 'ALMACÉN',
        sistema: 0,
        usuarioCreatedId: 1,
      },

      {
        denominacion: 'Azucar',
        superLinea: 'ALMACÉN',
        sistema: 0,
        usuarioCreatedId: 1,
      },
    
      {
        denominacion: 'BOLSAS',
        superLinea: 'BOLSAS Y DESCARTABLES',
        sistema: 0,
        usuarioCreatedId: 1,
      },

      {
        denominacion: 'Chocolates',
        superLinea: 'ALMACÉN',
        sistema: 0,
        usuarioCreatedId: 1,
      },

      {
        denominacion: 'HARINAS',
        superLinea: 'ALMACÉN',
        sistema: 0,
        usuarioCreatedId: 1,
      },

      {
        denominacion: 'MARGARINAS Y GRASAS',
        superLinea: 'ALMACÉN',
        sistema: 0,
        usuarioCreatedId: 1,
      },

    
    ];

    for (const data of entryData) {
      const exists = await this.lineaRepository.findOneBy({
        denominacion: data.denominacion.toUpperCase(),
      });

      if (!exists) {
        const superLinea = await this.superLineaRepository.findOneBy({
          denominacion: data.superLinea.toUpperCase(),
        });

        if (!superLinea) {
          console.log(
            `⚠️ SuperLinea "${data.superLinea}" was not found.`,
          );
          continue; // Never create a line without its super line
        }

        const usuarioCreated = await this.usuarioRepository.findOneBy({
          id: data.usuarioCreatedId,
        });

        if (!usuarioCreated) {
          console.log(
            `⚠️ No se encontró el usuario "${data.usuarioCreatedId}".`,
          );
          continue; // Evita crear la línea sin superlínea
        }

        const linea = this.lineaRepository.create({
          denominacion: data.denominacion.toUpperCase(),
          sistema: data.sistema,

          superLinea,
          superLineaId: superLinea.id,
          usuarioCreatedId: usuarioCreated.id,
        } as DeepPartial<Linea>); 

        await this.lineaRepository.save(linea);
        console.log(`✅ Linea "${data.denominacion}" creada.`);
      } else {
        console.log(`⚠️ Linea "${data.denominacion}" ya existe.`);
      }
    }
  }

  // Seed de Marcas
  async seedMarcas() {
    const entryData = [
      { denominacion: 'SIN MARCA', usuarioCreatedId: 1, sistema: 0 },
      { denominacion: 'CAROYENSE', usuarioCreatedId: 1, sistema: 0 },
      { denominacion: 'CIRCE', usuarioCreatedId: 1, sistema: 0 },
    
    ];

    for (const data of entryData) {
      const exists = await this.marcaRepository.findOneBy({
        denominacion: data.denominacion,
      });

      if (!exists) {
        const usuarioCreated = await this.usuarioRepository.findOneBy({
          id: data.usuarioCreatedId,
        });

        if (!usuarioCreated) {
          console.log(
            `⚠️ No se encontró el usuario "${data.usuarioCreatedId}".`,
          );
          continue; // Evita crear la línea sin superlínea
        }

        const marca = this.marcaRepository.create({
          denominacion: data.denominacion.toUpperCase(),
          usuarioCreatedId: usuarioCreated.id,
          sistema: data.sistema,
        } as DeepPartial<Marca>);

        await this.marcaRepository.save(marca);
        console.log(`✅ Marca "${data.denominacion}" creada.`);
      } else {
        console.log(`⚠️ Marca "${data.denominacion}" ya existe.`);
      }
    }
  }


  async runAllSeeds() {
    console.log('🚀 Iniciando todos los seeds...');


    await this.seedSuperLineas();
    await this.seedLineas();
    await this.seedMarcas();

    console.log('✅ Todos los seeds completados.');
  }
}
