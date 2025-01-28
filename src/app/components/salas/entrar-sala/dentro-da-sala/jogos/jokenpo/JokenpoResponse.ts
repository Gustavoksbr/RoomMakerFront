import {JokenpoLance} from './JokenpoLance';
import {JokenpoStatus} from './JokenpoStatus';

export interface JokenpoResponse{
  numero : number;
  lanceDono : JokenpoLance;
  lanceOponente : JokenpoLance;
  status : JokenpoStatus;
}
