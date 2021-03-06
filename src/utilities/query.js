/** */

const buildQuery = options => {
    let seek_conditions = {};
    const sort_condition = options.sort_by ? buildSortOrderString(options.sort_by) : '';
    const fields_to_return = options.return_only ? buildReturnFieldsString(options.return_only) : '';
    const count = options.count || false;

    let skip = 0, limit = Number.MAX_SAFE_INTEGER;
    
    if (options.page >= 0 && options.population) {
        const pagination = determinePagination(options.page, options.population);
        limit = pagination.limit;
        skip = pagination.skip;
    }

    /** Delete sort and return fields */
    delete options.count;
    delete options.page;
    delete options.population;
    delete options.return_only;
    delete options.sort_by;

    Object.keys(options).forEach((field) => {
        const field_value = options[field].toLowerCase();
        let condition;

        if (field_value.includes(':')) {
            condition = buildInQuery(field_value);
        } else if (field_value.includes('!')) {
            condition = buildNorQuery(field_value);
        } else if (field_value.includes('~')) {
            condition = buildRangeQuery(field_value);
        } else {
            condition = buildOrQuery(field_value);
        }

        seek_conditions[field] = { ...condition };
    });

    return {
        count,
        fields_to_return,
        limit,
        seek_conditions,
        skip,
        sort_condition,
    }
}

const buildInQuery = value => {
    const values = value.split(':');
    return {
        $in: [
            ...values
        ]
    };
}

const buildNorQuery = value => {
    const values = value.split('!');
    return {
        $nin: [
            ...(values.slice(1))
        ]
    }
}

const buildOrQuery = value => {
    const values = value.split(',');
    return {
        $in: [
            ...values
        ]
    };
}

const buildRangeQuery = value => {
    const values = value.split('~');
    return {
        $gte: values[0] ? Number(values[0]) : Number.MIN_SAFE_INTEGER,
        $lte: values[1] ? Number(values[1]) : Number.MAX_SAFE_INTEGER,
    };
}

const buildReturnFieldsString = value => {
    return value.replace(/,/gi, ' ');
}

const buildSortOrderString = value => {
    return value.replace(/,/gi, ' ');
}

const buildWildcardOptions = (key_list, value) => {
    const keys = key_list.split(',');
    return {
        $or: keys.map((key) => ({
                [key]: {
                    $regex : `${value}`,
                    $options: 'i',
                },
        })),
    };
}

const determinePagination = (page, population) => {
    return{
        limit: Number(population),
        skip: page * population,
    }
}

module.exports = {
    buildInQuery,
    buildNorQuery,
    buildOrQuery,
    buildQuery,
    buildRangeQuery,
    buildReturnFieldsString,
    buildSortOrderString,
    buildWildcardOptions,
    determinePagination,
}