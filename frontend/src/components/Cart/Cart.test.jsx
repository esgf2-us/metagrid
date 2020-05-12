/* eslint-disable react/jsx-props-no-spreading */
import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { render } from '@testing-library/react';

import Cart from './index';

const defaultProps = {
  // TODO: Replace with factory to generate mock objects
  cart: [
    {
      id:
        'CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.zg.gn.v20190724|esgf-data.ucar.edu',
      version: '20190724',
      access: ['HTTPServer', 'GridFTP', 'OPENDAP', 'Globus'],
      activity_drs: ['C4MIP'],
      activity_id: ['C4MIP'],
      cf_standard_name: ['geopotential_height'],
      citation_url: [
        'http://cera-www.dkrz.de/WDCC/meta/CMIP6/CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.zg.gn.v20190724.json',
      ],
      data_node: 'esgf-data.ucar.edu',
      data_specs_version: ['01.00.29'],
      dataset_id_template_: [
        '%(mip_era)s.%(activity_drs)s.%(institution_id)s.%(source_id)s.%(experiment_id)s.%(member_id)s.%(table_id)s.%(variable_id)s.%(grid_label)s',
      ],
      datetime_start: '0001-01-15T12:00:00Z',
      datetime_stop: '0150-12-15T12:00:00Z',
      directory_format_template_: [
        '%(root)s/%(mip_era)s/%(activity_drs)s/%(institution_id)s/%(source_id)s/%(experiment_id)s/%(member_id)s/%(table_id)s/%(variable_id)s/%(grid_label)s/%(version)s',
      ],
      east_degrees: 358.75,
      experiment_id: ['1pctCO2-bgc'],
      experiment_title: [
        'biogeochemically-coupled version of 1 percent per year increasing CO2 experiment',
      ],
      frequency: ['mon'],
      further_info_url: [
        'https://furtherinfo.es-doc.org/CMIP6.NCAR.CESM2.1pctCO2-bgc.none.r1i1p1f1',
      ],
      geo: [
        'ENVELOPE(-180.0, -1.25, 90.0, -90.0)',
        'ENVELOPE(0.0, 180.0, 90.0, -90.0)',
      ],
      geo_units: ['degrees_east'],
      grid: ['native 0.9x1.25 finite volume grid (192x288 latxlon)'],
      grid_label: ['gn'],
      height_bottom: 100000.0,
      height_top: 100.0,
      height_units: 'Pa',
      index_node: 'esgf-node.llnl.gov',
      instance_id:
        'CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.zg.gn.v20190724',
      institution_id: ['NCAR'],
      latest: true,
      master_id: 'CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.zg.gn',
      member_id: ['r1i1p1f1'],
      mip_era: ['CMIP6'],
      model_cohort: ['Registered'],
      nominal_resolution: ['100 km'],
      north_degrees: 90.0,
      number_of_aggregations: 2,
      number_of_files: 3,
      pid: ['hdl:21.14100/4a17ceec-9c75-3b1e-8965-414e3eff6a41'],
      product: ['model-output'],
      project: ['CMIP6'],
      realm: ['atmos'],
      replica: false,
      size: 3467624092,
      source_id: ['CESM2'],
      source_type: ['AOGCM', 'BGC', 'AER'],
      south_degrees: -90.0,
      sub_experiment_id: ['none'],
      table_id: ['Amon'],
      title: 'CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.zg.gn',
      type: 'Dataset',
      url: [
        'http://esgf-data.ucar.edu/thredds/catalog/esgcet/176/CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.zg.gn.v20190724.xml#CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.zg.gn.v20190724|application/xml+thredds|THREDDS',
      ],
      variable: ['zg'],
      variable_id: ['zg'],
      variable_long_name: ['Geopotential Height'],
      variable_units: ['m'],
      variant_label: ['r1i1p1f1'],
      west_degrees: 0.0,
      xlink: [
        'http://cera-www.dkrz.de/WDCC/meta/CMIP6/CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.zg.gn.v20190724.json|Citation|citation',
        'http://hdl.handle.net/hdl:21.14100/4a17ceec-9c75-3b1e-8965-414e3eff6a41|PID|pid',
      ],
      _version_: 1640152348733997056,
      retracted: false,
      _timestamp: '2019-07-26T19:59:29.981Z',
      score: 1.0,
    },
    {
      id:
        'CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.va.gn.v20190724|esgf-data.ucar.edu',
      version: '20190724',
      access: ['HTTPServer', 'GridFTP', 'OPENDAP', 'Globus'],
      activity_drs: ['C4MIP'],
      activity_id: ['C4MIP'],
      cf_standard_name: ['northward_wind'],
      citation_url: [
        'http://cera-www.dkrz.de/WDCC/meta/CMIP6/CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.va.gn.v20190724.json',
      ],
      data_node: 'esgf-data.ucar.edu',
      data_specs_version: ['01.00.29'],
      dataset_id_template_: [
        '%(mip_era)s.%(activity_drs)s.%(institution_id)s.%(source_id)s.%(experiment_id)s.%(member_id)s.%(table_id)s.%(variable_id)s.%(grid_label)s',
      ],
      datetime_start: '0001-01-15T12:00:00Z',
      datetime_stop: '0150-12-15T12:00:00Z',
      directory_format_template_: [
        '%(root)s/%(mip_era)s/%(activity_drs)s/%(institution_id)s/%(source_id)s/%(experiment_id)s/%(member_id)s/%(table_id)s/%(variable_id)s/%(grid_label)s/%(version)s',
      ],
      east_degrees: 358.75,
      experiment_id: ['1pctCO2-bgc'],
      experiment_title: [
        'biogeochemically-coupled version of 1 percent per year increasing CO2 experiment',
      ],
      frequency: ['mon'],
      further_info_url: [
        'https://furtherinfo.es-doc.org/CMIP6.NCAR.CESM2.1pctCO2-bgc.none.r1i1p1f1',
      ],
      geo: [
        'ENVELOPE(-180.0, -1.25, 90.0, -90.0)',
        'ENVELOPE(0.0, 180.0, 90.0, -90.0)',
      ],
      geo_units: ['degrees_east'],
      grid: ['native 0.9x1.25 finite volume grid (192x288 latxlon)'],
      grid_label: ['gn'],
      height_bottom: 100000.0,
      height_top: 100.0,
      height_units: 'Pa',
      index_node: 'esgf-node.llnl.gov',
      instance_id:
        'CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.va.gn.v20190724',
      institution_id: ['NCAR'],
      latest: true,
      master_id: 'CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.va.gn',
      member_id: ['r1i1p1f1'],
      mip_era: ['CMIP6'],
      model_cohort: ['Registered'],
      nominal_resolution: ['100 km'],
      north_degrees: 90.0,
      number_of_aggregations: 2,
      number_of_files: 3,
      pid: ['hdl:21.14100/c0645bfd-8e9a-3fcb-8de0-9d518df732a5'],
      product: ['model-output'],
      project: ['CMIP6'],
      realm: ['atmos'],
      replica: false,
      size: 5633327855,
      source_id: ['CESM2'],
      source_type: ['AOGCM', 'BGC', 'AER'],
      south_degrees: -90.0,
      sub_experiment_id: ['none'],
      table_id: ['Amon'],
      title: 'CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.va.gn',
      type: 'Dataset',
      url: [
        'http://esgf-data.ucar.edu/thredds/catalog/esgcet/176/CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.va.gn.v20190724.xml#CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.va.gn.v20190724|application/xml+thredds|THREDDS',
      ],
      variable: ['va'],
      variable_id: ['va'],
      variable_long_name: ['Northward Wind'],
      variable_units: ['m s-1'],
      variant_label: ['r1i1p1f1'],
      west_degrees: 0.0,
      xlink: [
        'http://cera-www.dkrz.de/WDCC/meta/CMIP6/CMIP6.C4MIP.NCAR.CESM2.1pctCO2-bgc.r1i1p1f1.Amon.va.gn.v20190724.json|Citation|citation',
        'http://hdl.handle.net/hdl:21.14100/c0645bfd-8e9a-3fcb-8de0-9d518df732a5|PID|pid',
      ],
      _version_: 1640152339436273664,
      retracted: false,
      _timestamp: '2019-07-26T19:59:21.114Z',
      score: 1.0,
    },
  ],
  handleCart: jest.fn(),
  clearCart: jest.fn(),
};
test('renders without crashing', async () => {
  const { getByTestId } = render(
    <Router>
      <Cart {...defaultProps} />
    </Router>
  );
  expect(getByTestId('cart')).toBeTruthy();
});

test('renders alert message when datacart is empty', async () => {
  const props = { ...defaultProps, cart: [] };
  const { getByText } = render(
    <Router>
      <Cart {...props} />
    </Router>
  );
  expect(getByText('Your cart is empty')).toBeTruthy();
});

test('renders items in the cart', async () => {
  test.todo('placeholder');
});

test('clicking remove button removes item', async () => {
  test.todo('placeholder');
});

test('clicking add button adds item', async () => {
  test.todo('placeholder');
});
