import { query } from "sdk/db";
import { producer } from "sdk/messaging";
import { extensions } from "sdk/extensions";
import { dao as daoApi } from "sdk/db";

export interface DepartmentEntity {
    readonly Id: number;
    Name?: string;
    Organization?: number;
}

export interface DepartmentCreateEntity {
    readonly Name?: string;
    readonly Organization?: number;
}

export interface DepartmentUpdateEntity extends DepartmentCreateEntity {
    readonly Id: number;
}

export interface DepartmentEntityOptions {
    $filter?: {
        equals?: {
            Id?: number | number[];
            Name?: string | string[];
            Organization?: number | number[];
        };
        notEquals?: {
            Id?: number | number[];
            Name?: string | string[];
            Organization?: number | number[];
        };
        contains?: {
            Id?: number;
            Name?: string;
            Organization?: number;
        };
        greaterThan?: {
            Id?: number;
            Name?: string;
            Organization?: number;
        };
        greaterThanOrEqual?: {
            Id?: number;
            Name?: string;
            Organization?: number;
        };
        lessThan?: {
            Id?: number;
            Name?: string;
            Organization?: number;
        };
        lessThanOrEqual?: {
            Id?: number;
            Name?: string;
            Organization?: number;
        };
    },
    $select?: (keyof DepartmentEntity)[],
    $sort?: string | (keyof DepartmentEntity)[],
    $order?: 'asc' | 'desc',
    $offset?: number,
    $limit?: number,
}

interface DepartmentEntityEvent {
    readonly operation: 'create' | 'update' | 'delete';
    readonly table: string;
    readonly entity: Partial<DepartmentEntity>;
    readonly key: {
        name: string;
        column: string;
        value: number;
    }
}

interface DepartmentUpdateEntityEvent extends DepartmentEntityEvent {
    readonly previousEntity: DepartmentEntity;
}

export class DepartmentRepository {

    private static readonly DEFINITION = {
        table: "CPDBEX_DEPARTMENT",
        properties: [
            {
                name: "Id",
                column: "DEPARTMENT_ID",
                type: "INTEGER",
                id: true,
                autoIncrement: true,
            },
            {
                name: "Name",
                column: "DEPARTMENT_NAME",
                type: "VARCHAR",
            },
            {
                name: "Organization",
                column: "DEPARTMENT_ORGANIZATION",
                type: "INTEGER",
            }
        ]
    };

    private readonly dao;

    constructor(dataSource = "DefaultDB") {
        this.dao = daoApi.create(DepartmentRepository.DEFINITION, null, dataSource);
    }

    public findAll(options?: DepartmentEntityOptions): DepartmentEntity[] {
        return this.dao.list(options);
    }

    public findById(id: number): DepartmentEntity | undefined {
        const entity = this.dao.find(id);
        return entity ?? undefined;
    }

    public create(entity: DepartmentCreateEntity): number {
        const id = this.dao.insert(entity);
        this.triggerEvent({
            operation: "create",
            table: "CPDBEX_DEPARTMENT",
            entity: entity,
            key: {
                name: "Id",
                column: "DEPARTMENT_ID",
                value: id
            }
        });
        return id;
    }

    public update(entity: DepartmentUpdateEntity): void {
        const previousEntity = this.findById(entity.Id);
        this.dao.update(entity);
        this.triggerEvent({
            operation: "update",
            table: "CPDBEX_DEPARTMENT",
            entity: entity,
            previousEntity: previousEntity,
            key: {
                name: "Id",
                column: "DEPARTMENT_ID",
                value: entity.Id
            }
        });
    }

    public upsert(entity: DepartmentCreateEntity | DepartmentUpdateEntity): number {
        const id = (entity as DepartmentUpdateEntity).Id;
        if (!id) {
            return this.create(entity);
        }

        const existingEntity = this.findById(id);
        if (existingEntity) {
            this.update(entity as DepartmentUpdateEntity);
            return id;
        } else {
            return this.create(entity);
        }
    }

    public deleteById(id: number): void {
        const entity = this.dao.find(id);
        this.dao.remove(id);
        this.triggerEvent({
            operation: "delete",
            table: "CPDBEX_DEPARTMENT",
            entity: entity,
            key: {
                name: "Id",
                column: "DEPARTMENT_ID",
                value: id
            }
        });
    }

    public count(options?: DepartmentEntityOptions): number {
        return this.dao.count(options);
    }

    public customDataCount(): number {
        const resultSet = query.execute('SELECT COUNT(*) AS COUNT FROM "CPDBEX_DEPARTMENT"');
        if (resultSet !== null && resultSet[0] !== null) {
            if (resultSet[0].COUNT !== undefined && resultSet[0].COUNT !== null) {
                return resultSet[0].COUNT;
            } else if (resultSet[0].count !== undefined && resultSet[0].count !== null) {
                return resultSet[0].count;
            }
        }
        return 0;
    }

    private async triggerEvent(data: DepartmentEntityEvent | DepartmentUpdateEntityEvent) {
        const triggerExtensions = await extensions.loadExtensionModules("codbex-organizations-Organizations-Department", ["trigger"]);
        triggerExtensions.forEach(triggerExtension => {
            try {
                triggerExtension.trigger(data);
            } catch (error) {
                console.error(error);
            }            
        });
        producer.topic("codbex-organizations-Organizations-Department").send(JSON.stringify(data));
    }
}
